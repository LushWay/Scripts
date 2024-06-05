import { BlockPermutation, BlockVolume, Dimension, StructureSaveMode, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { RadiusRegion } from './RadiusRegion'

export class RadiusRegionWithStructure extends RadiusRegion {
  static readonly kind: string = 'struct'

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

  forEachStructureBlock(
    callback: (vector: Vector3, structureSavedBlock: BlockPermutation | undefined, dimension: Dimension) => void,
  ) {
    const structure = world.structureManager.get(this.structureName)
    if (!structure) throw new TypeError('No structure found!')

    const edges = this.edges

    return this.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureSavedBlock = structure.getBlockPermutation(Vector.subtract(edges[0], vector))
        callback(vector, structureSavedBlock, dimension)
      }
    })
  }

  loadStructure() {
    return this.forEachStructureBlock((vector, block, dimension) => {
      if (block) dimension.setBlockPermutation(vector, block)
    })
  }
}
