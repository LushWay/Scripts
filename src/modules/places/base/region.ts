import { registerRegionKind } from 'lib/region/database'
import { RadiusRegion } from 'lib/region/kinds/radius'
import { type RegionPermissions } from 'lib/region/kinds/region'

// TODO Base levels, save structure of inital place on creation, shadow regions after removing etc

export class BaseRegion extends RadiusRegion {
  static readonly kind = 'base'

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    openContainers: false,
    pvp: true,
    owners: [],
  }
}
registerRegionKind(BaseRegion)
