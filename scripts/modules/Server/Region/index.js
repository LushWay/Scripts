import {
  EntitySpawnAfterEvent,
  Player,
  PlayerBreakBlockBeforeEvent,
  system,
  world,
} from '@minecraft/server'
import { GAME_UTILS } from 'xapi.js'
import { Region } from './Region.js'
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from './config.js'

let LOADED = false

/**
 * @callback interactionAllowed
 * @param {Player} player
 * @param {Region} [region]
 * @param {{type: "break", event: PlayerBreakBlockBeforeEvent} | {type: "place"} | {type: "useOn"}} context
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
 * @param {interactionAllowed} allowed
 * @param {spawnAllowed} spawnAllowed
 * @param {regionCallback} regionCallback
 */
export function loadRegionsWithGuards(
  allowed,
  spawnAllowed,
  regionCallback = () => void 0
) {
  if (LOADED) throw new ReferenceError('Regions already loaded!')
  LOADED = true

  /**
   * Permissions for region
   */
  world.beforeEvents.itemUseOn.subscribe(data => {
    if (!(data.source instanceof Player)) return
    const region = Region.locationInRegion(
      data.block,
      data.source.dimension.type
    )
    if (allowed(data.source, region, { type: 'useOn' })) return

    if (
      DOORS_SWITCHES.includes(data.block.typeId) &&
      region?.permissions?.doorsAndSwitches
    )
      return

    if (
      BLOCK_CONTAINERS.includes(data.block.typeId) &&
      region?.permissions?.openContainers
    )
      return

    data.cancel = true
  })

  /**
   * Permissions for region
   */
  world.beforeEvents.playerPlaceBlock.subscribe(event => {
    const region = Region.locationInRegion(
      event.block.location,
      event.player.dimension.type
    )
    if (!allowed(event.player, region, { type: 'place' })) event.cancel = true
  })

  /**
   * Permissions for region
   */

  world.beforeEvents.playerBreakBlock.subscribe(event => {
    const region = Region.locationInRegion(
      event.block.location,
      event.player.dimension.type
    )

    if (
      !allowed(event.player, region, {
        type: 'break',
        event,
      })
    ) {
      event.cancel = true
    }
  })

  world.afterEvents.entitySpawn.subscribe(({ entity, cause }) => {
    const typeId = GAME_UTILS.safeGetTypeID(entity)
    if (!typeId || typeId === 'rubedo:database') return
    const region = Region.locationInRegion(
      entity.location,
      entity.dimension.type
    )
    if (spawnAllowed(region, { entity, cause })) return
    if (
      region &&
      ((Array.isArray(region.permissions.allowedEntitys) &&
        region.permissions.allowedEntitys.includes(typeId)) ||
        region.permissions.allowedEntitys === 'all')
    )
      return

    entity.despawn()
  })

  system.runInterval(
    () => {
      if (!Region.config.SETTED) return

      for (const player of world.getAllPlayers()) {
        const currentRegion = Region.locationInRegion(
          player.location,
          player.dimension.type
        )

        regionCallback(player, currentRegion)
      }
    },
    'pvp region disable',
    20
  )

  console.log('§6Regions settings loaded')
}
