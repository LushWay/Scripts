import { StructureSaveMode, world } from '@minecraft/server'
import { Region } from 'lib/region'
import { BigStructure, BigStructureSaved } from 'lib/utils/big-structure'
import { Vec } from 'lib/vector'
import { RegionStructure } from './structure'

export class BigRegionStructure extends RegionStructure {
  private bigStructure: BigStructure

  constructor(
    protected region: Region,
    regionId: string,
  ) {
    super(region, regionId)

    const saved = region.ldb?.bigStructure
    const [from, to] = region.area.edges

    this.bigStructure = new BigStructure(
      'region',
      from,
      to,
      region.dimension,
      '',
      StructureSaveMode.World,
      false,
      regionId,
      Array.isArray(saved) ? (saved as BigStructureSaved[]) : undefined,
    )
  }

  get exists(): boolean {
    return !!world.structureManager.get(`mystructure:${this.bigStructure.prefix}|0`)
  }

  protected get bigStructurePos() {
    // TODO Use this.region.area.edges[0] after adding tests
    return (this.region.ldb?.bigStructurePos as unknown as Vector3 | undefined) ?? Vec.min(...this.region.area.edges)
  }

  save() {
    const pos = this.bigStructure.save()
    if (this.region.ldb) {
      this.region.ldb.bigStructure = this.bigStructure.toJSON()
      this.region.ldb.bigStructurePos = pos
      this.region.save()
    }
  }

  place() {
    return this.bigStructure.load(this.bigStructurePos, this.region.dimension)
  }

  validateArea() {
    return true
  }
}
