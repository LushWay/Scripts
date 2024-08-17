import { registerRegionKind } from 'lib/region/database'
import { type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { ores } from './algo'

export class MineshaftRegion extends RegionWithStructure {
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
    this.area.forEachVector((vector, isIn, dimension) => {
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
