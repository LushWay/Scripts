import {
  EntitySpawnAfterEvent,
  Player,
  PlayerBreakBlockBeforeEvent,
  PlayerInteractWithBlockBeforeEvent,
  PlayerInteractWithEntityBeforeEvent,
  PlayerPlaceBlockBeforeEvent,
  system,
  world,
} from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { PlayerEvents } from 'lib/assets/player-properties'
import { isBuilding } from 'lib/game-utils'
import { EventSignal } from '../event-signal'
import { BLOCK_CONTAINERS, DOORS, INTERACTABLE_ENTITIES, NOT_MOB_ENTITIES, SWITCHES, TRAPDOORS } from './config'
import { RegionEvents } from './events'
import { Region } from './kinds/region'
export * from './command'
export * from './config'
export * from './database'
export * from './kinds/region'

export * from './kinds/boss-arena'
export const ALLOW_SPAWN_PROP = 'allowSpawn'

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

type SpawnAllowed = (region: Region | undefined, data: EntitySpawnAfterEvent) => boolean | undefined
export type RegionCallback = (player: Player, region: Region | undefined) => void

const ACTION_GUARD = new EventSignal<Parameters<InteractionAllowed>, boolean | void, InteractionAllowed>()

export function actionGuard(fn: InteractionAllowed, position?: number) {
  ACTION_GUARD.subscribe(fn, position)
}

const allowed: InteractionAllowed = (player, region, context, regions) => {
  for (const [fn] of EventSignal.sortSubscribers(ACTION_GUARD)) {
    const result = fn(player, region, context, regions)
    if (typeof result !== 'undefined') return result
  }
}

actionGuard((player, region, ctx) => {
  // Allow any action to player in creative
  if (isBuilding(player)) return true

  // Allow any action to region member
  if (region?.getMemberRole(player.id)) return true

  if (ctx.type === 'interactWithEntity' || ctx.type === 'interactWithBlock') {
    const { typeId } = player.mainhand()

    if (typeId === MinecraftItemTypes.Bow || typeId === MinecraftItemTypes.Crossbow) {
      if (
        region?.permissions.allowedEntities === 'all' ||
        region?.permissions.allowedEntities.includes(MinecraftItemTypes.Arrow) ||
        region?.permissions.allowedEntities.includes(MinecraftItemTypes.FireworkRocket)
      ) {
        // Allow
      } else {
        return false
      }
    }
  }
}, 100)

function getRegions(location: Vector3, dimensionType: Dimensions) {
  const regions = Region.nearestRegions(location, dimensionType)
  const region = regions[0] as Region | undefined
  return { region, regions }
}

/** Permissions for region */
world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  const { regions, region } = getRegions(event.block, event.player.dimension.type)
  if (allowed(event.player, region, { type: 'interactWithBlock', event }, regions)) return

  if (region?.permissions.switches && SWITCHES.includes(event.block.typeId)) return // allow
  if (region?.permissions.doors && DOORS.includes(event.block.typeId)) return // allow
  if (region?.permissions.trapdoors && TRAPDOORS.includes(event.block.typeId)) return // allow
  if (region?.permissions.openContainers && BLOCK_CONTAINERS.includes(event.block.typeId)) return // allow

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
  if (NOT_MOB_ENTITIES.includes(entity.typeId) || !entity.isValid()) return

  const region = Region.nearestRegion(entity.location, entity.dimension.type)
  if (entity.getDynamicProperty(ALLOW_SPAWN_PROP)) return
  if (
    !region ||
    region.permissions.allowedEntities === 'all' ||
    region.permissions.allowedEntities.includes(entity.typeId)
  )
    return

  entity.remove()
})

system.runInterval(
  () => {
    for (const player of world.getAllPlayers()) {
      const previous = RegionEvents.playerInRegionsCache.get(player) ?? []
      const nearest = Region.nearestRegions(player.location, player.dimension.type)

      if (nearest.length !== previous.length || previous.some((region, i) => region !== nearest[i])) {
        EventSignal.emit(RegionEvents.onPlayerRegionsChange, { player, previous, newest: nearest })
      }

      RegionEvents.playerInRegionsCache.set(player, nearest)
      const currentRegion = nearest[0]

      if (typeof currentRegion !== 'undefined') {
        if (!currentRegion.permissions.pvp && !isBuilding(player)) {
          player.triggerEvent(
            player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
          )
        }
      }

      EventSignal.emit(RegionEvents.onInterval, { player, currentRegion })
    }
  },
  'region callback',
  20,
)
