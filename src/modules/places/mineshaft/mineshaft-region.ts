import { type RegionPermissions } from 'lib/region/Region'
import { registerRegionType } from 'lib/region/database'
import { RadiusRegionWithStructure } from 'lib/region/kinds/RadiusRegionWithStructure'
import { ores } from './algo'

export class MineshaftRegion extends RadiusRegionWithStructure {
  static readonly kind = 'mine'

  /** MineShaft is more prior then other regions */
  protected readonly priority = 1

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  protected onCreate(): void {
    this.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const block = dimension.getBlock(vector)
        const ore = block && ores.getOre(block.typeId)
        if (ore) block.setType(ore.empty)
      }
    })

    this.saveStructure()
  }
}

registerRegionType(MineshaftRegion)
