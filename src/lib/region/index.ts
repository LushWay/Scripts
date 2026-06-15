import {
  EntityHurtBeforeEvent,
  Player,
  PlayerBreakBlockBeforeEvent,
  PlayerInteractWithBlockBeforeEvent,
  PlayerInteractWithEntityBeforeEvent,
  PlayerPlaceBlockBeforeEvent,
  world,
} from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { noI18n } from 'lib/i18n/text'
import { onPlayerMove } from 'lib/player-move'
import { is } from 'lib/roles'
import { isNotPlaying } from 'lib/utils/game'
import { createLogger } from 'lib/utils/logger'
import { AbstractPoint } from 'lib/utils/point'
import { EventSignal } from '../event-signal'
import {
  BLOCK_CONTAINERS,
  DOORS,
  GATES,
  isForceSpawnInRegionAllowed,
  NOT_MOB_ENTITIES,
  SWITCHES,
  TRAPDOORS,
} from './config'
import { RegionEvents } from './events'
import './explosion'
import { Region } from './kinds/region'

// lazy
import('./command')

export * from './config'
export * from './database'

export * from './kinds/region'
export * from './kinds/road'
export * from './kinds/safe-area'

type InteractionAllowed = (
  player: Player,
  region: Region | undefined,
  context:
    | { type: 'break'; event: PlayerBreakBlockBeforeEvent }
    | { type: 'place'; event: PlayerPlaceBlockBeforeEvent }
    | { type: 'interactWithBlock'; event: PlayerInteractWithBlockBeforeEvent }
    | { type: 'interactWithEntity'; event: PlayerInteractWithEntityBeforeEvent },
  regions: Region[],
) => boolean | void

const ACTION_GUARD = new EventSignal<Parameters<InteractionAllowed>, boolean | void, InteractionAllowed>()

export function actionGuard(fn: InteractionAllowed, position: ActionGuardOrder) {
  ACTION_GUARD.subscribe(fn, position)
}

export const NEXT = undefined
export const ALLOW = true
export const CANCEL = false

export enum ActionGuardOrder {
  // Cutscene editing ignores everything
  EditMode = 14,
  // To stop player from spawning harmful projectiles
  ProjectileUsePrevent = 13,
  // Npc interaction should happen even if player has not permissions in region
  EntityAction = 12,
  // Place action. Interacting with block should happen even if player has not permissions in region
  BlockAction = 11,

  // Region member permissions
  RegionMember = 10,

  Anticheat = 9,
  // Vanilla features override (base placing etc). They should not work if player is not permitted to interact
  Feature = 8,
  // Limits
  Permission = 7,
  Low = 6,
  Lowest = 5,
}

export const regionTypesThatIgnoreIsBuildingGuard: (typeof Region)[] = []

actionGuard((player, region, ctx) => {
  if (region && regionTypesThatIgnoreIsBuildingGuard.some(e => region instanceof e)) return NEXT

  if (isNotPlaying(player)) return ALLOW

  if (region?.getMemberRole(player.id)) return ALLOW
}, ActionGuardOrder.RegionMember)

actionGuard((player, region, ctx) => {
  if (ctx.type === 'interactWithEntity' && ctx.event.target.hasTag('no_interact')) return CANCEL
  if (ctx.type !== 'interactWithBlock' || !region) return NEXT
  const { typeId } = ctx.event.block

  if (TRAPDOORS.includes(typeId)) return region.permissions.trapdoors // allow
  if (GATES.includes(typeId)) return region.permissions.gates // allow
  if (SWITCHES.includes(typeId)) return region.permissions.switches // allow
  if (DOORS.includes(typeId)) return region.permissions.doors // allow
  if (BLOCK_CONTAINERS.includes(typeId)) return region.permissions.openContainers // allow
}, ActionGuardOrder.Permission)

const itemToProjectile = new Map<string, string>([
  [MinecraftItemTypes.EnderPearl, MinecraftEntityTypes.EnderPearl],
  [MinecraftItemTypes.WindCharge, MinecraftEntityTypes.WindChargeProjectile],
  [MinecraftItemTypes.Snowball, MinecraftEntityTypes.SnowGolem],
])

actionGuard((player, region, context) => {
  if (region && (context.type === 'interactWithEntity' || context.type === 'interactWithBlock')) {
    const { allowedEntities: ent } = region.permissions

    if (ent !== 'all') {
      const { typeId } = player.mainhand()
      if (!typeId) return

      const arrow = ent.includes(MinecraftItemTypes.Arrow)
      const firework = ent.includes(MinecraftItemTypes.FireworkRocket)

      if (typeId === MinecraftItemTypes.Bow) return arrow
      if (typeId === MinecraftItemTypes.Crossbow) return arrow || firework
      const projectile = itemToProjectile.get(typeId)
      if (projectile) return ent.includes(projectile)
    }
  }
}, ActionGuardOrder.ProjectileUsePrevent)

const permdebugLogger = createLogger('region-perm')

const allowed: InteractionAllowed = (player, region, context, regions) => {
  //
  for (const [fn, order] of EventSignal.sortSubscribers(ACTION_GUARD)) {
    const result = fn(player, region, context, regions)
    if (Region.permissionDebug) {
      if (is(player.id, 'techAdmin')) {
        let msg = noI18n`${`§5${ActionGuardOrder[order]}`} ${fn.toString().replaceAll(/\s\s+/g, ' ').slice(0, 100).replaceAll('\n', ' ')} -> ${typeof result === 'undefined' ? '§bSKIP' : result}`
        if (typeof result === 'boolean') msg += noI18n`\n§fResult: ${result}`
        permdebugLogger.info(msg)
        player.tell(msg)
      }
    }
    if (typeof result === 'boolean') {
      return result
    }
  }
}

function getRegions(point: AbstractPoint) {
  const regions = Region.getManyAt(point)
  const region = regions[0]
  return { region, regions }
}

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'interactWithBlock', event }, regions)) return

  event.cancel = true
})

world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  const { regions, region } = getRegions(event.target)
  if (allowed(event.player, region, { type: 'interactWithEntity', event }, regions)) return

  event.cancel = true
})

world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'place', event }, regions)) return

  event.cancel = true
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'break', event }, regions)) return

  event.cancel = true
})

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  const { typeId } = entity
  if ((NOT_MOB_ENTITIES.includes(typeId) && typeId !== 'minecraft:item') || !entity.isValid) return

  const region = Region.getAt(entity)
  if (!region) return // Allow entity spawn outside of region by default

  const { allowedAllItem, allowedEntities, disallowedFamilies } = region.permissions

  if (isForceSpawnInRegionAllowed(entity)) return
  if (allowedAllItem && typeId === 'minecraft:item') return
  if (allowedEntities === 'all' || allowedEntities.includes(typeId)) return
  if (disallowedFamilies?.length && entity.matches({ excludeFamilies: disallowedFamilies })) return

  entity.remove()
})

onPlayerMove.subscribe(({ player, location, dimensionType }) => {
  const previous = RegionEvents.playerInRegionsCache.get(player) ?? []
  const newest = Region.getManyAt({ location, dimensionType })

  if (!Array.equals(newest, previous)) {
    EventSignal.emit(RegionEvents.onPlayerRegionsChange, { player, previous, newest })
  }

  RegionEvents.playerInRegionsCache.set(player, newest)
  const currentRegion = newest[0]

  EventSignal.emit(RegionEvents.onInterval, { player, currentRegion })
})

world.beforeEvents.entityHurt.subscribe(event => {
  const {
    hurtEntity,
    damageSource: { damagingEntity },
  } = event

  if (!damagingEntity?.isValid || !hurtEntity.isValid) return

  if (hurtEntity instanceof Player) {
    let isAllowed = true
    for (const callback of isGettingDamageAllowed) {
      const result = callback(hurtEntity)
      if (typeof result === 'boolean') {
        isAllowed = result
        break
      }
    }
    if (!isAllowed) cancelPvp(event)
  }

  const region = Region.getAt(hurtEntity)
  if (!region) return

  const { pvp } = region.permissions

  if (hurtEntity instanceof Player && damagingEntity instanceof Player) {
    if (pvp === true) {
      let isAllowed = true

      for (const callback of isPvPallowed) {
        const result = callback(damagingEntity, hurtEntity)
        if (typeof result === 'boolean') {
          isAllowed = result
          break
        }
      }
      if (!isAllowed) cancelPvp(event)
    } else {
      // pve or pvp disabled at all
      event.cancel = true
    }
  } else if (pvp === 'pve' || pvp) {
    // allow
  } else {
    // pvp is disabled
    event.cancel = true
  }
})

function cancelPvp(event: EntityHurtBeforeEvent) {
  event.cancel = true
}

const isGettingDamageAllowed: ((player: Player) => boolean | undefined)[] = []
const isPvPallowed: ((attacker: Player, reciever: Player) => boolean | undefined)[] = []

export const regionPermissions = {
  itemToProjectile,
  isPvPallowed,
  isGettingDamageAllowed,
}
