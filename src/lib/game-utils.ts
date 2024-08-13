import {
  EasingType,
  ItemStack,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  TicksPerSecond,
  system,
  world,
} from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftCameraPresetsTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { SafeLocation } from 'lib'
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
export function itemLocaleName(item: Pick<ItemStack, 'typeId'>) {
  let id = item.typeId.replace('minecraft:', '')
  if (blocks.includes(item.typeId)) {
    for (const fn of blockModifiers) {
      const result = fn(id)
      id = result ?? id
    }

    return `tile.${id}.name`
  }

  for (const fn of itemModifiers) {
    const result = fn(id)
    id = result ?? id
  }

  const name = `item.${id}.name`
  // for (const fn of afterItems) name = fn(name) ?? name

  return name
}

const blocks: string[] = Object.values(MinecraftBlockTypes as Record<string, string>).concat(
  MinecraftItemTypes.Planks as string,
  MinecraftItemTypes.Wood as string,
)
const itemTypes = ['boat', 'banner_pattern']
const itemRegExp = new RegExp(`^(.+)_(${itemTypes.join('|')})`)

const itemModifiers: ((s: string) => string | undefined)[] = [
  spawnEgg => {
    const match = /^(.+)_spawn_egg$/.exec(spawnEgg)
    if (!match) return
    return `spawn_egg.entity.${match[1]}`
  },
  chestBoat => {
    const match = /^(.+)_chest_boat$/.exec(chestBoat)
    if (!match) return
    return `chest_boat.${match[1]}`
  },
  cod => (cod === 'cod' ? 'fish' : cod),
  mutton => (mutton === 'mutton' ? 'muttonRaw' : mutton),
  id => {
    if (id.includes('.')) return
    const match = itemRegExp.exec(id)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },
  darkOak => {
    if (darkOak.includes('dark_oak') && darkOak !== 'dark_oak_door') return darkOak.replace('dark_oak', 'big_oak')
  },
  lazuli => (lazuli === 'lapis_lazuli' ? 'dye.blue' : lazuli),
]

// const afterItems: ((s: string) => string)[] = [s => s.replace(/\.name$/, '')]
const blockTypes = ['wool']
const blockRegExp = new RegExp(`^(.+)_(${blockTypes.join('|')})`)

const blockModifiers: ((s: string) => string | undefined)[] = [
  id => {
    if (id === 'cobblestone_wall') return `cobblestone_wall.normal`
  },
  id => {
    if (id.includes('.')) return
    const match = blockRegExp.exec(id)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },

  darkOak => {
    if (darkOak.includes('dark_oak') && darkOak !== 'dark_oak_door' && !darkOak.includes('wood'))
      return darkOak.replace('dark_oak', 'big_oak')
  },
  planks => {
    if (!planks.endsWith('planks')) return
    const type = planks.replace(/_?planks/, '')
    if (!['acacia', 'big_oak', 'birch', 'jungle', '', 'spruce', 'oak'].includes(type)) return planks

    if (!type) return 'planks'
    return `planks.${type}`
  },

  wood => {
    if (!wood.endsWith('wood')) return
    const type = wood.replace(/_?wood/, '')
    if (!['acacia', 'dark_oak', 'birch', 'jungle', '', 'spruce', 'oak'].includes(type)) return wood

    if (!type) return 'wood.oak'
    return `wood.${type}`
  },
  stone => {
    if (['andesite', 'andesiteSmooth', 'diorite', 'dioriteSmooth', 'granite', 'graniteSmooth', 'stone'].includes(stone))
      return `stone.${stone}`
  },
]

export const CURRENT_BUILDERS = new PersistentSet<string>('onlineBuilderList')

export function isBuilding(player: Player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative') && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

export function isNotPlaying(player: Player) {
  return isBuilding(player, true) || player.isGamemode('spectator')
}
