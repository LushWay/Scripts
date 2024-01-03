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
import { SYSTEM_ENTITIES } from 'config.js'
import { GAME_UTILS } from 'lib/Class/GameUtils.js'
import { Region } from './Class/Region.js'
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from './config.js'
import './init.js'
export * from './Class/CubeRegion.js'
export * from './Class/RadiusRegion.js'
export * from './Class/Region.js'
export * from './DB.js'
export * from './command.js'
export * from './config.js'

let LOADED = false

/**
 * @callback interactionAllowed
 * @param {Player} player
 * @param {Region} [region]
 * @param {{type: "break", event: PlayerBreakBlockBeforeEvent} | {type: "place", event: PlayerPlaceBlockBeforeEvent} | {type: "interactWithBlock", event: PlayerInteractWithBlockBeforeEvent} | {type: "interactWithEntity", event: PlayerInteractWithEntityBeforeEvent}} context
 */

/**
 * @callback regionCallback
 * @param {Player} player
 * @param {Region} [region]
 */

/**
 * @callback spawnAllowed
 * @param {Region} [region]
 * @param {EntitySpawnAfterEvent} data
 */

/**
 * Loads regions with specified guards.
 * WARNING! Loads only one time
 * @param {object} o
 * @param {interactionAllowed} o.allowed
 * @param {spawnAllowed} o.spawnAllowed
 * @param {regionCallback} [o.regionCallback]
 */
export function loadRegionsWithGuards({ allowed, spawnAllowed, regionCallback = () => void 0 }) {
  if (LOADED) throw new ReferenceError('Regions already loaded!')
  LOADED = true

  /**
   * Permissions for region
   */
  world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithBlock', event })) return

    if (DOORS_SWITCHES.includes(event.block.typeId) && region?.permissions?.doorsAndSwitches) return
    if (BLOCK_CONTAINERS.includes(event.block.typeId) && region?.permissions?.openContainers) return

    event.cancel = true
  })

  /**
   * Permissions for region
   */
  world.beforeEvents.playerInteractWithEntity.subscribe(event => {
    const region = Region.locationInRegion(event.target.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'interactWithEntity', event })) return

    event.cancel = true
  })

  /**
   * Permissions for region
   */
  world.beforeEvents.playerPlaceBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'place', event })) return

    event.cancel = true
  })

  /**
   * Permissions for region
   */

  world.beforeEvents.playerBreakBlock.subscribe(event => {
    const region = Region.locationInRegion(event.block.location, event.player.dimension.type)
    if (allowed(event.player, region, { type: 'break', event })) return

    event.cancel = true
  })

  world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
    const typeId = GAME_UTILS.safeGet(entity, 'typeId')
    const location = GAME_UTILS.safeGet(entity, 'location')
    const dimension = GAME_UTILS.safeGet(entity, 'dimension')
    if (!typeId || !location || !dimension || SYSTEM_ENTITIES.includes(typeId) || !entity.isValid()) return

    const region = Region.locationInRegion(location, dimension.type)
    if (spawnAllowed(region, { entity, cause })) return

    entity.remove()
  })

  system.runInterval(
    () => {
      for (const player of world.getAllPlayers()) {
        const currentRegion = Region.locationInRegion(player.location, player.dimension.type)

        regionCallback(player, currentRegion)
      }
    },
    'region callback',
    20
  )

  console.log('§6Regions settings loaded')
}
