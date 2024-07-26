import { registerRegionKind } from 'lib/region/database'
import { RadiusRegionWithStructure } from 'lib/region/kinds/radius-with-structure'
import { type RegionPermissions } from 'lib/region/kinds/region'
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
    let oresFound = 0
    this.forEachVector((vector, isIn, dimension) => {
      if (isIn) {
        const block = dimension.getBlock(vector)
        const ore = block && ores.getOre(block.typeId)
        if (ore) {
          block.setType(ore.empty)
          oresFound++
        }
      }
    })

    this.saveStructure()

    console.log('Created new mineshaft region. Ores found:', oresFound)
  }
}

registerRegionKind(MineshaftRegion)
