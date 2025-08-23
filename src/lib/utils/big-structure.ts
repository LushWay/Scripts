import { Dimension, StructurePlaceOptions, StructureSaveMode, system, world } from '@minecraft/server'
import { noI18n } from 'lib/i18n/text'
import { Vec } from 'lib/vector'
import { Cuboid } from './cuboid'

export interface BigStructureSaved extends JsonObject {
  id: string
  min: Vector3
  max: Vector3
}

export class BigStructure extends Cuboid {
  /**
   * Creates a new structure save
   *
   * @param {string} prefix
   * @param {Vector3} pos1
   * @param {Vector3} pos2
   */
  constructor(
    readonly prefix: string,
    pos1: Vector3,
    pos2: Vector3,
    public dimension: Dimension,
    readonly name = '',
    private readonly saveMode = StructureSaveMode.Memory,
    saveOnCreate = true,
    date = Date.now().toString(32),
    private structures: BigStructureSaved[] = [],
  ) {
    super(pos1, pos2)
    this.prefix = `${prefix}|${date}`

    if (saveOnCreate) this.save()
  }

  toJSON() {
    return this.structures
  }

  save() {
    this.structures = []
    const cubes = this.split({ x: 64, y: 384, z: 64 })

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
        saveMode: this.saveMode,
      })

      this.structures.push({ id, min, max })
    }

    return this.min
  }

  delete() {
    this.structures.forEach(e => world.structureManager.delete(e.id))
  }

  async load(position = this.min, dimension = this.dimension, placeOptions?: StructurePlaceOptions) {
    const { structures, min } = this

    if (!this.structures.length) throw new Error('Empty big structure save!!!')

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
                const offsetTo = Vec.subtract(file.min, min)
                to = Vec.add(position, offsetTo)
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
                noI18n`§c${errors}§f/${total}§c не загружено. Возможно, часть области была непрогруженна. Попробуйте снова, перед этим встав в центр.`,
              ),
            )

          resolve()
        })(),
      )
    })
  }
}
