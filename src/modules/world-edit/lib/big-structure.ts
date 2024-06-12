import { BlockVolume, Dimension, StructurePlaceOptions, StructureSaveMode, system, world } from '@minecraft/server'
import { Vector } from 'lib'
import { WE_CONFIG } from '../config'
import { Cuboid } from './ccuboid'

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

      // console.log(t`Created from world: ${Vector.string(min)} ${Vector.string(max)}, name: ${name}`)

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
    const { structures, min } = this

    return new Promise<void>((resolve, reject) => {
      let errors = 0
      let total = 0

      system.runJob(
        (function* job() {
          for (const file of structures) {
            try {
              let to

              if (position === min) {
                to = file.min
              } else {
                const offsetTo = Vector.subtract(file.min, min)
                to = Vector.add(position, offsetTo)
              }

              // console.log(`/structure load "${file.name}" ${Vector.string(to)}`)
              world.structureManager.place(file.name, dimension, to, placeOptions)
            } catch (e) {
              console.error(e)
              errors++
            } finally {
              total++
              yield
            }
          }

          if (errors > 0)
            reject(
              new Error(
                `§c${errors}§f/${total}§c не загружено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
              ),
            )

          resolve()
        })(),
      )
    })
  }
}
