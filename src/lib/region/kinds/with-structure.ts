import { BlockPermutation, Dimension, StructureSaveMode, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { Region } from './region'

export abstract class RegionWithStructure extends Region {
  protected get structureId() {
    return 'region:' + this.key.replaceAll(':', '|')
  }

  protected onCreate() {
    this.checkSaveability()
  }

  protected onRestore() {
    this.checkSaveability()
  }

  saveStructure(): void | Promise<void> {
    this.checkSaveability()
    world.structureManager.createFromWorld(this.structureId, this.dimension, ...this.area.edges, {
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
    const structure = world.structureManager.get(this.structureId)
    if (!structure) throw new TypeError('No structure found!')

    const [, edge] = this.area.edges

    return this.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureSavedBlock = structure.getBlockPermutation(Vector.multiply(Vector.subtract(edge, vector), -1))
        callback(vector, structureSavedBlock, dimension)
      }
    })
  }

  loadStructure() {
    return this.forEachStructureBlock((vector, block, dimension) => {
      if (block) dimension.setBlockPermutation(vector, block)
    })
  }

  deleteStructure() {
    world.structureManager.delete(this.structureId)
  }

  delete() {
    this.deleteStructure()
    super.delete()
  }
}
