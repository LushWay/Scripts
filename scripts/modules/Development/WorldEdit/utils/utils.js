import {
  BlockPermutation,
  BlockTypes,
  Player,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { WorldEdit } from 'modules/Development/WorldEdit/class/WorldEdit.js'
import { WE_CONFIG } from 'modules/Development/WorldEdit/config.js'
import { Cuboid } from 'modules/Development/WorldEdit/utils/cuboid.js'
import { Cooldown, util } from 'xapi.js'

/**
 * @param {Player} player
 * @param {string} shape shape equation to caculate
 * @param {Vector3} pos location to generate shape
 * @param {BlockPermutation[]} blocks blocks to use to fill block
 * @param {number} rad size of sphere
 * @example Shape(DefaultModes.sphere, Location, ["stone", "wood"], 10);
 */
export async function Shape(player, shape, pos, blocks, rad) {
  const loc1 = { x: -rad, y: -rad, z: -rad }
  const loc2 = { x: rad, z: rad, y: rad }

  WorldEdit.forPlayer(player).backup(
    Vector.add(pos, loc1),
    Vector.add(pos, loc2)
  )

  const cuboid = new Cuboid(loc1, loc2)
  const conditionFunction = new Function(
    'x, y, z, {xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter, xradius, yradius, zradius}, rad',
    `return ${shape}`
  )
  /** @type {(...args: number[]) => boolean} */
  const condition = (x, y, z) => conditionFunction(x, y, z, cuboid, rad)
  try {
    let blocksSet = 0

    const loc1 = { x: -rad, y: -rad, z: -rad }
    const loc2 = { x: rad, z: rad, y: rad }

    for (const { x, y, z } of Vector.foreach(loc1, loc2)) {
      if (!condition(x, y, z)) continue
      const location = Vector.add(pos, { x, y, z })
      world.overworld.getBlock(location)?.setPermutation(blocks.randomElement())
      blocksSet++

      if (blocksSet >= WE_CONFIG.BLOCKS_BEFORE_AWAIT) {
        await system.sleep(WE_CONFIG.TICKS_TO_SLEEP)
        blocksSet = 0
      }
    }
  } catch (e) {
    util.error(e)
  }
}

/**
 *
 * @param {number} ms
 * @returns
 */
export function get(ms) {
  let parsedTime = '0'
  let type = 'ошибок'

  /**
   * @param {number} value
   * @param {[string, string, string]} valueType 1 секунда 2 секунды 5 секунд
   */
  const set = (value, valueType, fiction = 0) => {
    if (parsedTime === '0' && ~~value > 1 && value < 100) {
      // Replace all 234.0 values to 234
      parsedTime = value
        .toFixed(fiction)
        .replace(/(\.[1-9]*)0+$/m, '$1')
        .replace(/\.$/m, '')

      type = Cooldown.getT(parsedTime, valueType)
    }
  }

  set(ms / (1000 * 60), ['минуту', 'минуты', 'минут'], 2)
  set(ms / 1000, ['секунду', 'секунды', 'секунд'], 1)
  set(ms, ['миллисекунду', 'миллисекунды', 'миллисекунд'], 1)

  return { parsedTime, type }
}
