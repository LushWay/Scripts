import {
  Block,
  EasingType,
  Enchantment,
  ItemStack,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  RawMessage,
  RawText,
  TicksPerSecond,
  system,
  world,
} from '@minecraft/server'
import { MinecraftCameraPresetsTypes, MinecraftEnchantmentTypes } from '@minecraft/vanilla-data'
import { blockItemsLangJson } from 'lib/assets/blocks-items-lang'
import { dedupe } from 'lib/dedupe'
import { SafeLocation } from 'lib/location'
import { Vector } from 'lib/vector'
import { PersistentSet } from './database/persistent-set'
import { getRole } from './roles'

/** Represents location in the specific dimension */
export interface LocationInDimension {
  /** Location of the place */
  location: Vector3 | SafeLocation<Vector3>
  /** Dimension of the location */
  dimensionId: Dimensions
}

/** Checks if block on specified location is loaded (e.g. we can operate with blocks/entities on it) and returns it */
export function getBlockStatus({ location, dimensionId }: LocationInDimension) {
  try {
    if ('valid' in location && !location.valid) return 'unloaded'

    const block = world[dimensionId].getBlock(location)
    if (!block?.isValid()) return 'unloaded'

    return block
  } catch (e) {
    if (e instanceof LocationInUnloadedChunkError) return 'unloaded'
    throw e
  }
}

/** Checks if chunks is loaded (e.g. we can operate with blocks/entities on it) */
export function isChunkUnloaded(options: LocationInDimension) {
  return getBlockStatus(options) === 'unloaded'
}

/**
 * Checks if provided object is instance of {@link LocationInUnloadedChunkError} or
 * {@link LocationOutOfWorldBoundariesError}
 */
export function isInvalidLocation(
  error: unknown,
): error is LocationInUnloadedChunkError | LocationOutOfWorldBoundariesError {
  return error instanceof LocationInUnloadedChunkError || error instanceof LocationOutOfWorldBoundariesError
}

/**
 * Restores player camera with easing and nice animation.
 *
 * @param player - Player to restore camera to
 * @param animTime - Time of the animation
 */
export function restorePlayerCamera(player: Player, animTime = 1) {
  player.camera.setCamera(MinecraftCameraPresetsTypes.Free, {
    location: Vector.add(player.getHeadLocation(), Vector.multiply(player.getViewDirection(), 0.3)),
    facingLocation: Vector.add(player.getHeadLocation(), Vector.multiply(player.getViewDirection(), 10)),
    easeOptions: {
      easeTime: animTime,
      easeType: EasingType.OutCubic,
    },
  })

  system.runTimeout(
    () => player.camera.setCamera(MinecraftCameraPresetsTypes.FirstPerson),
    restorePlayerCamera.name,
    animTime * TicksPerSecond,
  )
}

/**
 * Converts any minecraft type id to human readable format, e.g. removes minecraft: prefix, replaces _ with spaces and
 * capitalizes first letter
 *
 * @deprecated Consider using {@link langKey}
 * @example
 *   typeIdToReadable('minecraft:chorus_fruit') // Chorus fruit
 *
 * @example
 *   typeIdToReadable('minecraft:cobblestone') // Cobblestone
 *
 * @param {string} typeId
 */
export function typeIdToReadable(typeId: string) {
  // Format
  typeId = typeId.replace(/^minecraft:/, '').replace(/_(.)/g, ' $1')

  // Capitalize first letter
  typeId = typeId[0].toUpperCase() + typeId.slice(1)

  return typeId
}

/**
 * Gets localization name of the ItemStack
 *
 * @example
 *   const apple = new ItemStack(MinecraftItemTypes.Apple)
 *   langKey(apple) // %item.apple.name
 */
export function langKey(item: Pick<ItemStack, 'typeId'> | string) {
  const typeId = typeof item === 'object' ? item.typeId : item
  return typeId in blockItemsLangJson ? blockItemsLangJson[typeId] : typeId
}

export const CURRENT_BUILDERS = new PersistentSet<string>('onlineBuilderList')

/**
 * Check if player is currently building. Building player is player who is in the creative and whose role isn't member
 *
 * @param player - Player to check
 * @param uptodate - If true, it will force get players status, if false, which is default, will get from cache
 * @returns - Whenether player is building or not
 */
export function isBuilding(player: Player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative') && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

/**
 * Checks if player {@link isBuilding} or in spectator mode
 *
 * @param player - Player to check
 * @returns - Whenether player is playing or not
 */
export function isNotPlaying(player: Player) {
  return isBuilding(player, true) || player.isGamemode('spectator')
}

/** Adds minecraft: namespace to the text if not added already */
export function nmspc(text: string) {
  return text.includes(':') ? text : `minecraft:${text}`
}

/**
 * Returns RawText representation of an Enchantment or Enchantment Type. If Enchanment is provided, also returns its as
 * another translated RawMessage
 */
export function translateEnchantment(e: MinecraftEnchantmentTypes | Enchantment): RawText {
  const rawtext: RawMessage[] = [{ translate: langKey({ typeId: typeof e === 'string' ? e : e.type.id }) }]
  if (typeof e === 'object') {
    rawtext.push(
      { text: ' ' },
      e.level < 10 ? { translate: `enchantment.level.${e.level.toString()}` } : { text: e.level.toString() },
    )
  }
  return { rawtext }
}

export async function getTopmostSolidBlock(location: Vector3) {
  if (await loadChunk(location)) {
    const hit = world.overworld.getBlockFromRay(location, Vector.down, { includeLiquidBlocks: true })
    if (!hit) return false

    const { block } = hit
    if (block.isLiquid || block.isAir) {
      return false
    } else return block.location
  } else return false
}

/**
 * Tries to load chunk at provided location by adding tickingarea and trying to get block at location 100 times. If
 * chunk is still unloaded, returns false. If chunk is finally loaded, returns block.
 *
 * This function can be called only once concurrently. For example, if it was earlier called in the other part of script
 * and you call it here, it will wait for previous function to finish loading chunk and only then will execute. That is
 * for preventing overload
 */
const loadChunk = dedupe(async function loadChunk(location: Vector3) {
  // console.debug('Load chunk entering', Vector.string(location, true))
  await world.overworld.runCommandAsync(`tickingarea remove ldchnk`)
  await world.overworld.runCommandAsync(`tickingarea add ${Vector.string(location)} ${Vector.string(location)} ldchnk `)

  let i = 100
  return new Promise<false | Block>(resolve => {
    function done(result: false | Block) {
      stopInterval()
      world.overworld.runCommand(`tickingarea remove ldchnk`)
      // console.debug('Load chunk exit.', !!result)
      resolve(result)
    }

    const stopInterval = system.runJobInterval(() => {
      if (i < 0) return done(false)

      const status = getBlockStatus({ location, dimensionId: 'overworld' })
      if (status === 'unloaded') {
        i--
        // console.debug('Chunk is unloaded')
        return
      }

      return done(status)
    }, 5)
  })
})

/**
 * Generates a random 2D vector within a circle of a specified radius.
 *
 * @param radius - The radius of the circle from which you want to generate a random vector.
 * @returns - An object with properties `x` and `z`, representing a random vector within a circle of the specified
 *   radius.
 */
export function getRandomVectorInCircle(radius: number): { x: number; z: number } {
  const angle = Math.randomFloat(0, 2 * Math.PI)
  const distance = Math.randomFloat(100, radius)
  const result = {
    x: distance * Math.cos(angle),
    z: distance * Math.sin(angle),
  }

  return result
}
