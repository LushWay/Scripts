import { BlockVolume, StructureSaveMode, system, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { RadiusRegion } from './RadiusRegion'

export class RadiusRegionWithStructure extends RadiusRegion {
  static readonly kind = 'struct'

  protected readonly saveable = true

  protected get structureName() {
    return 'region:' + this.key.replaceAll(':', '|')
  }

  protected get edges() {
    return Vector.around(this.center, this.radius - 1)
  }

  saveStructure() {
    if (this.radius > 32) {
      throw new TypeError(
        RadiusRegionWithStructure.name + ' can only save structures with radius <= 32 because of the structures limit.',
      )
    }

    // console.log('Saving structure with name', this.structureName, 'and egdes', this.edges)
    world.structureManager.createFromWorld(
      this.structureName,
      world[this.dimensionId],
      new BlockVolume(...this.edges),
      {
        saveMode: StructureSaveMode.World,
        includeEntities: false,
        includeBlocks: true,
      },
    )
  }

  loadStructure() {
    const structure = world.structureManager.get(this.structureName)
    if (!structure) throw new TypeError('No structure found!')

    const edges = this.edges
    const isIn = (v: Vector3) => this.isVectorInRegion(v, this.dimensionId)
    const dimension = world[this.dimensionId]

    return new Promise<void>((resolve, reject) => {
      system.runJob(
        (function* loadStructureJob() {
          try {
            for (const vector of Vector.foreach(...edges)) {
              if (isIn(vector)) {
                const block = structure.getBlockPermutation(Vector.subtract(edges[0], vector))
                if (block) dimension.setBlockPermutation(vector, block)
                yield
              }
            }
            resolve()
          } catch (e: unknown) {
            reject(e as Error)
          }
        })(),
      )
    })
  }
}
