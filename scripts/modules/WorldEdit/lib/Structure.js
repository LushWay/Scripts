import { Vector, system, world } from '@minecraft/server'
import { WE_CONFIG } from '../config.js'
import { Cuboid } from './Cuboid.js'

export class Structure extends Cuboid {
  /**
   * @private
   * @type {{
   *   name: string
   *   min: Vector3
   *   max: Vector3
   * }[]}
   */
  structures = []

  /**
   * Creates a new structure save
   *
   * @param {string} prefix
   * @param {Vector3} pos1
   * @param {Vector3} pos2
   */
  constructor(prefix, pos1, pos2, name = '') {
    super(pos1, pos2)
    this.id = Date.now().toString(32)
    this.name = name
    this.prefix = `${prefix}|${this.id}`

    this.savePromise = this.save()
  }

  async save() {
    this.structures = []
    const cubes = this.split(WE_CONFIG.STRUCTURE_CHUNK_SIZE)
    // console.debug({ cubes: cubes.map(e => Vector.string(Vector.subtract(e.max, e.min)), true) })

    const options = { errors: 0, total: 0 }

    for (const [i, cube] of cubes.entries()) {
      const name = `${this.prefix}|${i}`
      const min = cube.pos1
      const max = cube.pos2
      const result = await performCommandOnLoadedChunkAndTeleportPlayerIfNot(
        `structure save "${name}" ${Vector.string(min)} ${Vector.string(max)} false memory true`,
        min,
        max,
        options,
      )

      if (result > 0) {
        this.structures.push({
          name,
          min,
          max,
        })
      }
    }

    // console.debug(options.total, this.structures.length)

    if (options.errors > 0)
      throw new Error(
        `§c${options.errors}§f/${options.total}§c не сохранено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
      )
  }

  async load(pos = this.min, additional = '') {
    const options = { errors: 0, total: 0 }

    for (const file of this.structures) {
      let to
      let from

      if (pos === this.min) {
        to = file.min
        from = file.max
      } else {
        const offsetFrom = Vector.subtract(file.max, this.min)
        const offsetTo = Vector.subtract(file.min, this.min)
        from = Vector.add(pos, offsetFrom)
        to = Vector.add(pos, offsetTo)
      }

      await performCommandOnLoadedChunkAndTeleportPlayerIfNot(
        `structure load "${file.name}" ${Vector.string(to)}${additional}`,
        from,
        to,
        options,
      )

      await nextTick
    }

    if (options.errors > 0)
      throw new Error(
        `§c${options.errors}§f/${options.total}§c не загружено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
      )
  }
}

/**
 * @param {string} command
 * @param {Vector3} vector1
 * @param {Vector3} vector2
 * @param {{ errors: number; total: number }} options
 */
async function performCommandOnLoadedChunkAndTeleportPlayerIfNot(command, vector1, vector2, options, forceTp = false) {
  let result = 0
  if (!forceTp) {
    result = world.overworld.runCommand(command)
  }
  console.debug(command, result)
  options.total++

  if (!result) {
    world.say('Область будет прогружена (' + options.total + ')')

    // world.overworld.runCommand(`tickingarea remove safezone`)
    // await nextTick

    world.getAllPlayers()[0].teleport(Vector.divide(Vector.add(vector1, vector2), 2))

    // world.overworld.runCommand(`tickingarea add ${Vector.string(vector1)} ${Vector.string(vector2)} safezone`)
    await system.sleep(60)

    const result = world.overworld.runCommand(command)

    if (!result) world.say('§cНеуспешно' + options.total)
    if (!result) {
      options.errors++
      return 0
    }
  }
  return 1
}
