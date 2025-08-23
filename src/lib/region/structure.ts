import {
  BlockPermutation,
  Dimension,
  LocationInUnloadedChunkError,
  StructureSaveMode,
  system,
  world,
} from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib/vector'
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
    const dimensionType = dimension.type

    const unloadedBlocks: {
      location: Vector3
      permutation: BlockPermutation | undefined
    }[] = []

    await this.forEachBlock((location, permutation) => {
      try {
        if (permutation) this.region.dimension.setBlockPermutation(location, permutation)
        else this.region.dimension.setBlockType(location, MinecraftBlockTypes.Air)
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) unloadedBlocks.push({ location, permutation })
        else console.error(e)
      }
    }, 100)

    // for (const { location, permutation } of unloadedBlocks) {
    //   ScheduleBlockPlace.deleteAt(location, dimensionType)

    //   if (permutation) {
    //     ScheduleBlockPlace.setPermutation(permutation, location, dimensionType, 0)
    //   } else {
    //     ScheduleBlockPlace.setAir(location, dimension.type, 0)
    //   }
    // }
  }

  delete() {
    world.structureManager.delete(this.id)
  }

  validateArea() {
    const { x, y, z } = this.region.area.size
    if (x >= 64 || y >= 128 || z >= 64) {
      throw new TypeError(
        `Can only save structures with x <= 64, y <= 128 and z <= 64 because of the structures limit. Got ${Vec.string({ x, y, z })}`,
      )
    }
  }

  forEachBlock(
    callback: (location: Vector3, structureSavedBlock: BlockPermutation | undefined, dimension: Dimension) => void,
    yieldEach?: number,
  ) {
    const structure = world.structureManager.get(this.id)
    if (!structure) throw new ReferenceError('No structure found!')

    const [from] = this.region.area.edges
    const offset = this.offset ? { x: this.offset, y: this.offset, z: this.offset } : undefined

    return this.region.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const structureLocation = Vec.subtract(vector, from)
        const structureSavedBlock = structure.getBlockPermutation(
          offset ? Vec.add(structureLocation, offset) : structureLocation,
        )
        callback(vector, structureSavedBlock, dimension)
      }
    }, yieldEach)
  }
}
