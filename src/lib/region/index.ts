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
import { Region } from './Class/Region'
import { BLOCK_CONTAINERS, DOORS_AND_SWITCHES, NOT_MOB_ENTITIES } from './config'
import './init'
export * from './Class/CubeRegion'
export * from './Class/RadiusRegion'
export * from './Class/Region'
export * from './DB'
export * from './command'
export * from './config'

export const ACTION_GUARD: EventSignal<
  Parameters<InteractionAllowed>,
  boolean | undefined,
  InteractionAllowed
> = new EventSignal()

export function actionGuard(fn: InteractionAllowed, position?: number) {
  ACTION_GUARD.subscribe(fn, position)
}

type InteractionAllowed = (
  player: Player,
  region: Region | undefined,
  context:
    | { type: 'break'; event: PlayerBreakBlockBeforeEvent }
    | { type: 'place'; event: PlayerPlaceBlockBeforeEvent }
    | { type: 'interactWithBlock'; event: PlayerInteractWithBlockBeforeEvent }
    | { type: 'interactWithEntity'; event: PlayerInteractWithEntityBeforeEvent },
) => boolean | void

const allowed: InteractionAllowed = (player, region, context) => {
  for (const [fn] of EventSignal.sortSubscribers(ACTION_GUARD)) {
    const result = fn(player, region, context)
    if (typeof result !== 'undefined') return result
  }
}

type SpawnAllowed = (region: Region | undefined, data: EntitySpawnAfterEvent) => boolean | undefined
export type RegionCallback = (player: Player, region: Region) => void

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

  /** Permissions for region */
  world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithBlock', event })) return

    if (DOORS_AND_SWITCHES.includes(event.block.typeId) && region?.permissions?.doorsAndSwitches) return
    if (BLOCK_CONTAINERS.includes(event.block.typeId) && region?.permissions?.openContainers) return

    event.cancel = true
  })

  /** Permissions for region */
  world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const region = Region.locationInRegion(event.target.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithEntity', event })) return

    event.cancel = true
  })

  /** Permissions for region */
  world.beforeEvents.playerPlaceBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'place', event })) return

    event.cancel = true
  })

  /** Permissions for region */
  world.beforeEvents.playerBreakBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'break', event })) return

    event.cancel = true
  })

  world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
    if (NOT_MOB_ENTITIES.includes(entity.typeId) || !entity.isValid()) return

    const region = Region.locationInRegion(entity.location, entity.dimension.type)
    if (spawnAllowed(region, { entity, cause })) return

    entity.remove()
  })

  system.runInterval(
    () => {
      for (const player of world.getAllPlayers()) {
        const previous = Region.playerInRegionsCache.get(player) ?? []
        const newest = Region.nearestRegions(player.location, player.dimension.type)

        if (newest.length !== previous.length || previous.some((region, i) => region !== newest[i])) {
          EventSignal.emit(Region.onPlayerRegionsChange, { player, previous, newest })
        }

        Region.playerInRegionsCache.set(player, newest)

        regionCallback(player, newest[0])
      }
    },
    'region callback',
    20,
  )

  console.log('§7Regions and guards are loaded')
}
