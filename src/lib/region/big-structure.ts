import { StructureSaveMode, world } from '@minecraft/server'
import { Region } from 'lib/region'
import { BigStructure } from 'lib/utils/big-structure'
import { RegionStructure } from './structure'

export class BigRegionStructure extends RegionStructure {
  private bigStructure: BigStructure

  constructor(region: Region, regionId: string) {
    super(region, regionId)

    this.bigStructure = new BigStructure(
      'region',
      ...region.area.edges,
      region.dimension,
      '',
      StructureSaveMode.World,
      false,
    )
  }

  get exists(): boolean {
    return !!world.structureManager.get(`mystructure:${this.bigStructure.prefix}|0`)
  }

  save() {
    this.bigStructure.save()
  }

  place() {
    return this.bigStructure.load(this.region.area.edges[0], this.region.dimension)
  }

  validateArea() {
    return true
  }
}
