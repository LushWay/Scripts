import {
  EasingType,
  ItemStack,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Player,
  TicksPerSecond,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftCameraPresetsTypes } from '@minecraft/vanilla-data.js'
import { BDS } from './BDS/modules.js'

/**
 * @param {string} name
 * @returns {undefined | string}
 */
export function env(name) {
  if (BDS.ServerAdmin) {
    return BDS.ServerAdmin.variables.get(name)
  }
}

export function isProduction() {
  return env('production')
}

/**
 * Checks if block on specified location is loaded (e.g. we can operate with blocks/entities on it) and returns it
 *
 * @param {object} o - Options
 * @param {Vector3} o.location - Location to check
 * @param {Dimensions} o.dimensionId - Dimensions to check
 * @returns - Block on location
 */
export function blockStatus({ location, dimensionId }) {
  try {
    const block = world[dimensionId].getBlock(location)
    if (!block || !block.isValid()) return 'unloaded'
    return block
  } catch (e) {
    if (e instanceof LocationInUnloadedChunkError) return 'unloaded'
    throw e
  }
}

/**
 * Checks if chunks is loaded (e.g. we can operate with blocks/entities on it)
 *
 * @param {Parameters<typeof blockStatus>[0]} options
 */
export function chunkIsUnloaded(options) {
  return blockStatus(options) === 'unloaded'
}

/**
 * Checks if provided error is location in unloaded chunk or out of world bounds error
 *
 * @param {unknown} error
 * @returns {error is LocationInUnloadedChunkError | LocationOutOfWorldBoundariesError}
 */
export function invalidLocation(error) {
  return error instanceof LocationInUnloadedChunkError || error instanceof LocationOutOfWorldBoundariesError
}

/** @param {Player} player */
export function restorePlayerCamera(player, animTime = 1) {
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
export function typeIdToReadable(typeId) {
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
 *   ;```js
 *   const apple = new ItemStack(MinecraftItemTypes.Apple)
 *   itemLocaleName(apple) // %item.apple.name
 *   ```
 *
 * @param {ItemStack} item
 */
export function itemLocaleName(item) {
  let id = item.typeId.replace('minecraft:', '')
  if (blocks.includes(item.typeId)) {
    for (const fn of blockModifiers) {
      const result = fn(id)
      id = result ?? id
    }

    return `%tile.${id}.name`
  }

  for (const fn of itemModifiers) {
    const result = fn(id)
    id = result ?? id
  }

  let name = `%item.${id}.name`
  for (const fn of afterItems) name = fn(name) ?? name

  return name
}

/** @type {string[]} */
const blocks = Object.values(MinecraftBlockTypes)

const itemTypes = ['boat', 'banner_pattern']
const itemRegExp = new RegExp(`^(.+)_(${itemTypes.join('|')})`)

/** @type {((s: string) => string | undefined)[]} */
const itemModifiers = [
  spawnEgg => {
    const match = spawnEgg.match(/^(.+)_spawn_egg$/)
    if (!match) return
    return `spawn_egg.entity.${match[1]}`
  },
  chestBoat => {
    const match = chestBoat.match(/^(.+)_chest_boat$/)
    if (!match) return
    return `chest_boat.${match[1]}`
  },
  id => {
    if (id.includes('.')) return
    const match = id.match(itemRegExp)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },
  darkOak => {
    if (darkOak.includes('dark_oak') && darkOak !== 'dark_oak_door') return darkOak.replace('dark_oak', 'big_oak')
  },
]
/** @type {((s: string) => string)[]} */
const afterItems = [s => s.replace(/\.name$/, '')]

const blockTypes = ['wool']
const blockRegExp = new RegExp(`^(.+)_(${blockTypes.join('|')})`)

/** @type {((s: string) => string | undefined)[]} */
const blockModifiers = [
  id => {
    if (id === 'cobblestone_wall') return `cobblestone_wall.normal`
  },
  id => {
    if (id.includes('.')) return
    const match = id.match(blockRegExp)
    if (!match) return
    const [, color, type] = match
    return `${type}.${color}`
  },
]
