import { BlockPermutation, Dimension, StructureSaveMode, world } from '@minecraft/server'
import { Vector } from 'lib/vector'
import { Region } from './kinds/region'

export class RegionStructure {
  constructor(private region: Region) {}

  protected id = `region:${this.region.id.replaceAll(':', '|')}`

  /** Used when structure was saved with bigger area radius, for example in BaseRegion */
  offset = 0

  save(): void | Promise<void> {
    this.validateArea()
    world.structureManager.createFromWorld(this.id, this.region.dimension, ...this.region.area.edges, {
      saveMode: StructureSaveMode.World,
      includeEntities: false,
      includeBlocks: true,
    })
  }

  get exists() {
    return !!world.structureManager.get(this.id)
  }

  place() {
    return this.forEachBlock((vector, block, dimension) => {
      try {
        if (block) dimension.setBlockPermutation(vector, block)
      } catch (e) {
        console.warn('Unable to set block for structure:', e)
        // TODO Scheduled block place?
      }
    })
  }

  delete() {
    world.structureManager.delete(this.id)
  }

  validateArea() {
    const { x, y, z } = this.region.area.size
    if (x >= 64 || y >= 128 || z >= 64) {
      throw new TypeError(
        `Can only save structures with x <= 64, y <= 128 and z <= 64 because of the structures limit. Got ${Vector.string({ x, y, z })}`,
      )
    }
  }

  forEachBlock(
    callback: (location: Vector3, structureSavedBlock: BlockPermutation | undefined, dimension: Dimension) => void,
  ) {
    const structure = world.structureManager.get(this.id)
    if (!structure) throw new ReferenceError('No structure found!')

    const [, edge] = this.region.area.edges
    const offset = this.offset ? { x: this.offset, y: this.offset, z: this.offset } : undefined

    return this.region.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureLocation = Vector.multiply(Vector.subtract(edge, vector), -1)
        const structureSavedBlock = structure.getBlockPermutation(
          offset ? Vector.add(structureLocation, offset) : structureLocation,
        )
        callback(vector, structureSavedBlock, dimension)
      }
    })
  }
}
