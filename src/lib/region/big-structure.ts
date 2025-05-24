import { StructureSaveMode, world } from '@minecraft/server'
import { Region } from 'lib/region'
import { BigStructure, BigStructureSaved } from 'lib/utils/big-structure'
import { Vector } from 'lib/vector'
import { RegionStructure } from './structure'

export class BigRegionStructure extends RegionStructure {
  private bigStructure: BigStructure

  constructor(region: Region, regionId: string) {
    super(region, regionId)

    const saved = region.ldb?.bigStructure

    const [from, to] = region.area.edges
    this.bigStructure = new BigStructure(
      'region',
      Vector.min(from, to),
      Vector.max(from, to),
      region.dimension,
      '',
      StructureSaveMode.World,
      false,
      regionId,
      Array.isArray(saved) ? (saved as BigStructureSaved[]) : undefined,
    )

    if (region.ldb) region.ldb.bigStructure = this.bigStructure.toJSON()
  }

  get exists(): boolean {
    return !!world.structureManager.get(`mystructure:${this.bigStructure.prefix}|0`)
  }

  save() {
    this.bigStructure.save()
  }

  place() {
    return this.bigStructure.load(Vector.min(...this.region.area.edges), this.region.dimension)
  }

  validateArea() {
    return true
  }
}
