import { Dimension, StructurePlaceOptions, StructureSaveMode, system, world } from '@minecraft/server'
import { Vector } from 'lib'
import { WE_CONFIG } from '../config'
import { Cuboid } from './cuboid'

export class BigStructure extends Cuboid {
  private structures: {
    id: string
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
    private prefix: string,
    pos1: Vector3,
    pos2: Vector3,
    public dimension: Dimension,
    public name = '',
  ) {
    super(pos1, pos2)
    this.prefix = `${prefix}|${Date.now().toString(32)}`

    this.save()
  }

  save() {
    this.structures = []
    const cubes = this.split(WE_CONFIG.STRUCTURE_CHUNK_SIZE)

    for (const [i, cube] of cubes.entries()) {
      const id = `mystructure:${this.prefix}|${i}`
      const min = cube.pos1
      const max = cube.pos2

      try {
        world.structureManager.delete(id)
      } catch {}

      world.structureManager.createFromWorld(id, this.dimension, min, max, {
        includeEntities: false,
        includeBlocks: true,
        saveMode: StructureSaveMode.Memory,
      })

      this.structures.push({ id, min, max })
    }
  }

  delete() {
    this.structures.forEach(e => world.structureManager.delete(e.id))
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
              world.structureManager.place(file.id, dimension, to, placeOptions)
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
