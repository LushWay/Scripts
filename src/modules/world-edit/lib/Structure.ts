import { BlockVolume, Dimension, StructurePlaceOptions, StructureSaveMode, system, world } from '@minecraft/server'
import { Vector } from 'lib'
import { WE_CONFIG } from '../config'
import { Cuboid } from './Cuboid'

export class BigStructure extends Cuboid {
  id

  savePromise

  private structures: {
    name: string
    min: Vector3
    max: Vector3
  }[] = []

  /**
   * Creates a new structure save
   *
   * @param {string} prefix
   * @param {Vector3} pos1
   * @param {Vector3} pos2
   */
  constructor(
    public prefix: string,
    pos1: Vector3,
    pos2: Vector3,
    public dimension: Dimension,
    public name = '',
  ) {
    super(pos1, pos2)
    this.id = Date.now().toString(32)
    this.prefix = `${prefix}|${this.id}`

    this.savePromise = this.save()
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async save() {
    this.structures = []
    const cubes = this.split(WE_CONFIG.STRUCTURE_CHUNK_SIZE)
    // console.debug({ cubes: cubes.map(e => Vector.string(Vector.subtract(e.max, e.min)), true) })

    const options = { errors: 0, total: 0 }

    for (const [i, cube] of cubes.entries()) {
      const name = `mystructure:${this.prefix}|${i}`
      const min = cube.pos1
      const max = cube.pos2
      try {
        world.structureManager.delete(name)
      } catch {}
      world.structureManager.createFromWorld(name, this.dimension, new BlockVolume(min, max), {
        includeEntities: false,
        includeBlocks: true,
        saveMode: StructureSaveMode.Memory,
      })

      // const result = await performCommandOnLoadedChunkAndTeleportPlayerIfNot(
      //   `structure save "${name}" ${Vector.string(min)} ${Vector.string(max)} false memory true`,
      //   min,
      //   max,
      //   options,
      // )

      this.structures.push({
        name,
        min,
        max,
      })
    }

    // console.debug(options.total, this.structures.length)
    if (options.errors > 0)
      throw new Error(
        `§c${options.errors}§f/${options.total}§c не сохранено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
      )
  }

  async load(position = this.min, dimension = this.dimension, placeOptions?: StructurePlaceOptions) {
    const options = { errors: 0, total: 0 }

    for (const file of this.structures) {
      let to
      let from

      if (position === this.min) {
        to = file.min

        from = file.max
      } else {
        const offsetFrom = Vector.subtract(file.max, this.min)

        const offsetTo = Vector.subtract(file.min, this.min)
        from = Vector.add(position, offsetFrom)
        to = Vector.add(position, offsetTo)
      }

      world.structureManager.place(file.name, dimension, to, placeOptions)
      // await performCommandOnLoadedChunkAndTeleportPlayerIfNot(
      //   `structure load "${file.name}" ${Vector.string(to)}${additional}`,
      //   from,
      //   to,
      //   options,
      // )

      await system.sleep(1)
    }

    if (options.errors > 0)
      throw new Error(
        `§c${options.errors}§f/${options.total}§c не загружено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
      )
  }
}
