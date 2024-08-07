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
import { EventSignal } from '../event-signal'
import { BLOCK_CONTAINERS, DOORS_AND_SWITCHES, NOT_MOB_ENTITIES } from './config'
import { RegionEvents } from './events'
import { Region } from './kinds/region'
export * from './command'
export * from './config'
export * from './database'
export * from './kinds/region'

export * from './kinds/radius'

export * from './kinds/cube'

export * from './kinds/boss-arena'
export * from './kinds/dungeon'
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

let LOADED = false

/**
 * Loads regions with specified guards. WARNING! Loads only one time
 *
 * @param o
 * @param o.spawnAllowed
 * @param o.regionCallback
 */
export function loadRegionsWithGuards({
  spawnAllowed,
  regionCallback = () => void 0,
}: {
  spawnAllowed: SpawnAllowed
  regionCallback?: RegionCallback
}) {
  if (LOADED) throw new Error('Regions are already loaded!')
  LOADED = true

  function getRegions(location: Vector3, dimensionType: Dimensions) {
    const regions = Region.nearestRegions(location, dimensionType)
    const region = regions[0] as Region | undefined
    return { region, regions }
  }

  /** Permissions for region */
  world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const { regions, region } = getRegions(event.block, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithBlock', event }, regions)) return

    if (DOORS_AND_SWITCHES.includes(event.block.typeId) && region?.permissions.doorsAndSwitches) return
    if (BLOCK_CONTAINERS.includes(event.block.typeId) && region?.permissions.openContainers) return

    event.cancel = true
  })

  /** Permissions for region */
  world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const { regions, region } = getRegions(event.target.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithEntity', event }, regions)) return

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

  world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
    if (NOT_MOB_ENTITIES.includes(entity.typeId) || !entity.isValid()) return

    const region = Region.nearestRegion(entity.location, entity.dimension.type)
    if (spawnAllowed(region, { entity, cause })) return

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
        regionCallback(player, nearest[0])
      }
    },
    'region callback',
    20,
  )

  console.log('§7Regions and guards are loaded')
}
