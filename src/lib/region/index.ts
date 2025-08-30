import {
  EntityHealthComponent,
  Player,
  PlayerBreakBlockBeforeEvent,
  PlayerInteractWithBlockBeforeEvent,
  PlayerInteractWithEntityBeforeEvent,
  PlayerPlaceBlockBeforeEvent,
  world,
} from '@minecraft/server'
import { MinecraftEntityTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { PlayerEvents, PlayerProperties } from 'lib/assets/player-json'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n, noI18n } from 'lib/i18n/text'
import { onPlayerMove } from 'lib/player-move'
import { is } from 'lib/roles'
import { isNotPlaying } from 'lib/utils/game'
import { AbstractPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { EventSignal } from '../event-signal'
import {
  BLOCK_CONTAINERS,
  DOORS,
  GATES,
  INTERACTABLE_ENTITIES,
  isForceSpawnInRegionAllowed,
  NOT_MOB_ENTITIES,
  SWITCHES,
  TRAPDOORS,
} from './config'
import { RegionEvents } from './events'
import { Region } from './kinds/region'

export * from './command'
export * from './config'
export * from './database'

export * from './kinds/boss-arena'
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

export enum ActionGuardOrder {
  ProjectileUsePrevent = 12,
  // Place action. Interacting with block
  BlockAction = 11,
  // Region member permissions
  RegionMember = 10,
  Anticheat = 9,
  // Vanilla features override (base placing etc)
  Feature = 8,
  // Limits
  Permission = 7,
  Lowest = 6,
}

export const regionTypesThatIgnoreIsBuildingGuard: (typeof Region)[] = []

actionGuard((player, region, ctx) => {
  if (region && regionTypesThatIgnoreIsBuildingGuard.some(e => region instanceof e)) return

  if (isNotPlaying(player)) return true

  if (region?.getMemberRole(player.id)) return true
}, ActionGuardOrder.RegionMember)

actionGuard((player, region, ctx) => {
  if (ctx.type === 'interactWithEntity' && ctx.event.target.hasTag('no_interact')) return false
  if (ctx.type !== 'interactWithBlock' || !region) return
  const { typeId } = ctx.event.block

  if (TRAPDOORS.includes(typeId)) return region.permissions.trapdoors // allow
  if (GATES.includes(typeId)) return region.permissions.gates // allow
  if (SWITCHES.includes(typeId)) return region.permissions.switches // allow
  if (DOORS.includes(typeId)) return region.permissions.doors // allow
  if (BLOCK_CONTAINERS.includes(typeId)) return region.permissions.openContainers // allow
}, ActionGuardOrder.Permission)

actionGuard((player, region, context) => {
  if (region && (context.type === 'interactWithEntity' || context.type === 'interactWithBlock')) {
    const { allowedEntities: ent } = region.permissions

    if (ent !== 'all') {
      const { typeId } = player.mainhand()
      const arrow = ent.includes(MinecraftItemTypes.Arrow)
      const firework = ent.includes(MinecraftItemTypes.FireworkRocket)

      if (typeId === MinecraftItemTypes.Bow) return arrow
      if (typeId === MinecraftItemTypes.Crossbow) return arrow || firework
      if (typeId === MinecraftItemTypes.EnderPearl) return ent.includes(MinecraftEntityTypes.EnderPearl)
      if (typeId === MinecraftItemTypes.WindCharge) return ent.includes(MinecraftEntityTypes.WindChargeProjectile)
      if (typeId === MinecraftItemTypes.Snowball) return ent.includes(MinecraftEntityTypes.Snowball)
      if (typeId === Items.Fireball) return ent.includes(CustomEntityTypes.Fireball)
    }
  }
}, ActionGuardOrder.ProjectileUsePrevent)

const allowed: InteractionAllowed = (player, region, context, regions) => {
  //
  for (const [fn] of EventSignal.sortSubscribers(ACTION_GUARD)) {
    const result = fn(player, region, context, regions)
    if (Region.permissionDebug) {
      if (is(player.id, 'techAdmin')) console.log('regionDebug', fn.toString().slice(0, 50), ' ', result)
      player.info(noI18n`regionDebug ${fn.toString().slice(0, 50).replaceAll('\n', ' ')} ${result}`)
    }
    if (typeof result === 'boolean') {
      return result
    }
  }
}

function getRegions(point: AbstractPoint) {
  const regions = Region.getManyAt(point)
  const region = regions[0] as Region | undefined
  return { region, regions }
}

/** Permissions for region */
world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'interactWithBlock', event }, regions)) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  const { regions, region } = getRegions(event.target)
  if (allowed(event.player, region, { type: 'interactWithEntity', event }, regions)) return

  // Allow interacting with any interactable entity by default
  if (INTERACTABLE_ENTITIES.includes(event.target.typeId) && !region?.permissions.pvp) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'place', event }, regions)) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerBreakBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block)
  if (allowed(event.player, region, { type: 'break', event }, regions)) return

  event.cancel = true
})

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  const { typeId } = entity
  if ((NOT_MOB_ENTITIES.includes(typeId) && typeId !== 'minecraft:item') || !entity.isValid) return

  const region = Region.getAt(entity)

  if (isForceSpawnInRegionAllowed(entity) || (typeId === 'minecraft:item' && region?.permissions.allowedAllItem)) return
  if (!region || region.permissions.allowedEntities === 'all' || region.permissions.allowedEntities.includes(typeId))
    return

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
  const isPlaying = !isNotPlaying(player)

  const resetNewbie = () => player.setProperty(PlayerProperties['lw:newbie'], !!player.database.survival.newbie)

  if (typeof currentRegion !== 'undefined' && isPlaying) {
    if (currentRegion.permissions.pvp === false) {
      player.triggerEvent(
        player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
      )
      player.setProperty(PlayerProperties['lw:newbie'], true)
    } else if (currentRegion.permissions.pvp === 'pve') {
      player.setProperty(PlayerProperties['lw:newbie'], true)
    } else resetNewbie()
  } else resetNewbie()

  EventSignal.emit(RegionEvents.onInterval, { player, currentRegion })
})

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damage, damageSource: { damagingEntity } }) => {
  if (!damagingEntity?.isValid || !hurtEntity.isValid) return

  const region = Region.getAt(hurtEntity)
  if (!region) return

  const pvp = region.permissions.pvp
  if (pvp === true) return
  if (pvp === 'pve' && !(hurtEntity instanceof Player && damagingEntity instanceof Player)) return

  let direction = Vec.subtract(damagingEntity.location, hurtEntity.location).normalized()
  direction = Vec.multiply(direction, 10)

  if (damagingEntity instanceof Player) {
    damagingEntity.onScreenDisplay.setActionBar(
      i18n.error`Нельзя сражаться в мирной зоне`.to(damagingEntity.lang),
      ActionbarPriority.High,
    )
  }

  const health = damagingEntity.getComponent(EntityHealthComponent.componentId)
  if (!health) {
    damagingEntity.kill()
  } else {
    health.setCurrentValue(health.currentValue - damage)
    damagingEntity.applyDamage(0)
    if (health.currentValue >= 0) damagingEntity.applyKnockback(direction, direction.y)
  }
})
