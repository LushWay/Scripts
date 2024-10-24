import {
  Player,
  PlayerBreakBlockBeforeEvent,
  PlayerInteractWithBlockBeforeEvent,
  PlayerInteractWithEntityBeforeEvent,
  PlayerPlaceBlockBeforeEvent,
  system,
  world,
} from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { PlayerEvents, PlayerProperties } from 'lib/assets/player-json'
import { isBuilding } from 'lib/game-utils'
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

actionGuard((player, region, ctx) => {
  if (isBuilding(player)) return true

  if (region?.getMemberRole(player.id)) return true
}, ActionGuardOrder.RegionMember)

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'interactWithBlock' || !region) return
  const { typeId } = ctx.event.block

  if (TRAPDOORS.includes(typeId)) return region.permissions.trapdoors // allow
  if (GATES.includes(typeId)) return region.permissions.gates // allow
  if (SWITCHES.includes(typeId)) return region.permissions.switches // allow
  if (DOORS.includes(typeId)) return region.permissions.doors // allow
  if (BLOCK_CONTAINERS.includes(typeId)) return region.permissions.openContainers // allow
}, ActionGuardOrder.Permission)

const allowed: InteractionAllowed = (player, region, context, regions) => {
  // Disable bow in regions where allowed entities does not allow spawning arrow or firework
  if (region && (context.type === 'interactWithEntity' || context.type === 'interactWithBlock')) {
    const { typeId } = player.mainhand()
    const { allowedEntities } = region.permissions

    if (
      (typeId === MinecraftItemTypes.Bow || typeId === MinecraftItemTypes.Crossbow) &&
      !(
        allowedEntities === 'all' ||
        allowedEntities.includes(MinecraftItemTypes.Arrow) ||
        allowedEntities.includes(MinecraftItemTypes.FireworkRocket)
      )
    ) {
      return false
    }
  }

  //
  for (const [fn] of EventSignal.sortSubscribers(ACTION_GUARD)) {
    const result = fn(player, region, context, regions)
    if (typeof result === 'boolean') {
      return result
    }
  }
}

function getRegions(location: Vector3, dimensionType: Dimensions) {
  const regions = Region.nearestRegions(location, dimensionType)
  const region = regions[0] as Region | undefined
  return { region, regions }
}

/** Permissions for region */
world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block, event.player.dimension.type)
  if (allowed(event.player, region, { type: 'interactWithBlock', event }, regions)) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerInteractWithEntity.subscribe(event => {
  const { regions, region } = getRegions(event.target.location, event.player.dimension.type)
  if (allowed(event.player, region, { type: 'interactWithEntity', event }, regions)) return

  // Allow interacting with any interactable entity by default
  if (INTERACTABLE_ENTITIES.includes(event.target.typeId) && !region?.permissions.pvp) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerPlaceBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block.location, event.player.dimension.type)
  if (allowed(event.player, region, { type: 'place', event }, regions)) return

  event.cancel = true
})

/** Permissions for region */
world.beforeEvents.playerBreakBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block.location, event.player.dimension.type)
  if (allowed(event.player, region, { type: 'break', event }, regions)) return

  event.cancel = true
})

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  const { typeId } = entity
  if ((NOT_MOB_ENTITIES.includes(typeId) && typeId !== 'minecraft:item') || !entity.isValid()) return

  const region = Region.nearestRegion(entity.location, entity.dimension.type)

  if (isForceSpawnInRegionAllowed(entity) || (typeId === 'minecraft:item' && region?.permissions.allowedAllItem)) return
  if (!region || region.permissions.allowedEntities === 'all' || region.permissions.allowedEntities.includes(typeId))
    return

  entity.remove()
})

system.runInterval(
  () => {
    for (const player of world.getAllPlayers()) {
      const previous = RegionEvents.playerInRegionsCache.get(player) ?? []
      const newest = Region.nearestRegions(player.location, player.dimension.type)

      if (!Array.equals(newest, previous)) {
        EventSignal.emit(RegionEvents.onPlayerRegionsChange, { player, previous, newest })
      }

      RegionEvents.playerInRegionsCache.set(player, newest)
      const currentRegion = newest[0]

      if (typeof currentRegion !== 'undefined' && !isBuilding(player)) {
        if (currentRegion.permissions.pvp === false) {
          player.triggerEvent(
            player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
          )
        } else if (currentRegion.permissions.pvp === 'pve') {
          player.setProperty(PlayerProperties['lw:newbie'], true)
        } else if (!player.database.survival.newbie) player.setProperty(PlayerProperties['lw:newbie'], true)
      }

      EventSignal.emit(RegionEvents.onInterval, { player, currentRegion })
    }
  },
  'region callback',
  20,
)
