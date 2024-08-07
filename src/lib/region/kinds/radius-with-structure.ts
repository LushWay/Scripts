import { BlockPermutation, Dimension, StructureSaveMode, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { RadiusRegion } from './radius'

export abstract class RadiusRegionWithStructure extends RadiusRegion {
  protected readonly saveable = true

  protected get structureName() {
    return 'region:' + this.key.replaceAll(':', '|')
  }

  saveStructure() {
    if (this.radius > 32) {
      throw new TypeError(
        RadiusRegionWithStructure.name + ' can only save structures with radius <= 32 because of the structures limit.',
      )
    }

    // console.log('Saving structure with name', this.structureName, 'and egdes', this.edges)
    world.structureManager.createFromWorld(this.structureName, world[this.dimensionId], ...this.edges, {
      saveMode: StructureSaveMode.World,
      includeEntities: false,
      includeBlocks: true,
    })
  }

  forEachStructureBlock(
    callback: (vector: Vector3, structureSavedBlock: BlockPermutation | undefined, dimension: Dimension) => void,
  ) {
    const structure = world.structureManager.get(this.structureName)
    if (!structure) throw new TypeError('No structure found!')

    const edges = this.edges

    return this.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureSavedBlock = structure.getBlockPermutation(
          Vector.multiply(Vector.subtract(edges[1], vector), -1),
        )
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
