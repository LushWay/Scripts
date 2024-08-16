import {
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
import { MinecraftCameraPresetsTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { SafeLocation } from 'lib'
import { blockItemsLangJson } from 'lib/assets/blocks-items-lang'
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
 * @deprecated Consider using {@link itemLocaleName}
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
 *   itemLocaleName(apple) // %item.apple.name
 */
export function itemLocaleName(item: Pick<ItemStack, 'typeId'> | string) {
  const typeId = typeof item === 'object' ? item.typeId : item
  return typeId in blockItemsLangJson ? blockItemsLangJson[typeId] : typeId
}

export const CURRENT_BUILDERS = new PersistentSet<string>('onlineBuilderList')

export function isBuilding(player: Player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative') && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

export function isNotPlaying(player: Player) {
  return isBuilding(player, true) || player.isGamemode('spectator')
}

/** Adds minecraft: namespace to the text if not added already */
export function nmspc(text: string) {
  return text.includes(':') ? text : `minecraft:${text}`
}

export function translateEnchantment(e: MinecraftEntityTypes | Enchantment): RawText {
  const rawtext: RawMessage[] = [{ translate: itemLocaleName({ typeId: typeof e === 'string' ? e : e.type.id }) }]
  if (typeof e === 'object') {
    rawtext.push(
      { text: ' ' },
      e.level < 10 ? { translate: `enchantment.level.${e.level.toString()}` } : { text: e.level.toString() },
    )
  }
  return { rawtext }
}
