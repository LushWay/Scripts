import {
  Block,
  BlockPermutation,
  Dimension,
  LocationInUnloadedChunkError,
  StructureSaveMode,
  system,
  world,
} from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { getScheduledToPlaceAsync, scheduleBlockPlace, unscheduleBlockPlace } from 'lib/scheduled-block-place'
import { Vector } from 'lib/vector'
import { Region } from './kinds/region'

system.delay(() => {
  // Due to a bug there is a ton of randomly saved structures
  world.structureManager
    .getWorldStructureIds()
    .filter(e => /region:undefined-s-\d+-\d+\/.+/.exec(e))
    .forEach(e => {
      console.log('Deleted unused structure', e)
      world.structureManager.delete(e)
    })
})

export class RegionStructure {
  constructor(
    protected region: Region,
    protected regionId: string,
  ) {
    this.id = `region:${this.regionId.replaceAll(':', '|')}`
  }

  protected id: string

  /** Used when structure was saved with bigger area radius, for example in BaseRegion */
  offset = 0

  save(): void | Promise<void> {
    this.validateArea()
    // TODO Test that changin order of edges does not break structure
    world.structureManager.createFromWorld(this.id, this.region.dimension, ...this.region.area.edges, {
      saveMode: StructureSaveMode.World,
      includeEntities: false,
      includeBlocks: true,
    })
  }

  get exists() {
    return !!world.structureManager.get(this.id)
  }

  async place() {
    const dimension = this.region.dimension
    interface VectorPermutation {
      vector: Vector3
      permutation: BlockPermutation | undefined
    }

    const blocks: VectorPermutation[] = []
    await this.forEachBlock((vector, block) => blocks.push({ vector, permutation: block }), 1000)

    const unloadedBlocks: VectorPermutation[] = []
    for (const block of blocks) {
      try {
        if (block.permutation) this.region.dimension.setBlockPermutation(block.vector, block.permutation)
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) unloadedBlocks.push(block)
      }
    }

    const schedules = await getScheduledToPlaceAsync(
      unloadedBlocks.map(e => e.vector),
      this.region.dimensionType,
    )
    if (schedules) {
      for (const unloadedBlock of unloadedBlocks) {
        const schedule = schedules.find(e => Vector.equals(e.location, unloadedBlock.vector))
        if (schedule) unscheduleBlockPlace(schedule)
        scheduleBlockPlace({
          dimension: dimension.type,
          location: unloadedBlock.vector,
          typeId: unloadedBlock.permutation?.type.id ?? MinecraftBlockTypes.Air,
          states: unloadedBlock.permutation?.getAllStates() ?? {},
          restoreTime: 0,
        })
      }
    }
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
    yieldEach?: number,
  ) {
    const structure = world.structureManager.get(this.id)
    if (!structure) throw new ReferenceError('No structure found!')

    const [edge] = this.region.area.edges
    const offset = this.offset ? { x: this.offset, y: this.offset, z: this.offset } : undefined

    return this.region.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureLocation = Vector.multiply(Vector.subtract(edge, vector), -1)
        const structureSavedBlock = structure.getBlockPermutation(
          offset ? Vector.add(structureLocation, offset) : structureLocation,
        )
        callback(vector, structureSavedBlock, dimension)
      }
    }, yieldEach)
  }
}
