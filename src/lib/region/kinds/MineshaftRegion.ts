import { type RegionPermissions } from 'lib/region/Region'
import { RadiusRegion } from './RadiusRegion'

export class MineshaftRegion extends RadiusRegion {
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
}
