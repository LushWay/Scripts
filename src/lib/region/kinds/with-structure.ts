import { BlockPermutation, Dimension, StructureSaveMode, world } from '@minecraft/server'
import { Region } from './region'
import { Vector } from 'lib/vector'

export abstract class RegionWithStructure extends Region {
  protected readonly saveable = true

  protected get structureName() {
    return 'region:' + this.key.replaceAll(':', '|')
  }

  protected onCreate() {
    this.checkSaveability()
  }

  protected onRestore() {
    this.checkSaveability()
  }

  saveStructure() {
    this.checkSaveability()

    // console.log('Saving structure with name', this.structureName, 'and egdes', this.edges)
    world.structureManager.createFromWorld(this.structureName, this.dimension, ...this.area.edges, {
      saveMode: StructureSaveMode.World,
      includeEntities: false,
      includeBlocks: true,
    })
  }

  protected checkSaveability() {
    const { x, y, z } = this.area.size
    if (x >= 64 || y >= 128 || z >= 64) {
      throw new TypeError(
        `${RegionWithStructure.name} can only save structures with x <= 64, y <= 128 and z <= 64 because of the structures limit. Got ${Vector.string({ x, y, z })}`,
      )
    }
  }

  forEachStructureBlock(
    callback: (vector: Vector3, structureSavedBlock: BlockPermutation | undefined, dimension: Dimension) => void,
  ) {
    const structure = world.structureManager.get(this.structureName)
    if (!structure) throw new TypeError('No structure found!')

    const edges = this.area.edges

    return this.area.forEachVector((vector, isIn, dimension) => {
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
