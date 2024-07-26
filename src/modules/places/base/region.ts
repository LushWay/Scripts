import { registerRegionKind } from 'lib/region/database'
import { RadiusRegionWithStructure } from 'lib/region/kinds/radius-with-structure'
import { type RegionPermissions } from 'lib/region/kinds/region'

// TODO Base levels, save structure of inital place on creation, shadow regions after removing etc

export class BaseRegion extends RadiusRegionWithStructure {
  static readonly kind = 'base'

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: false,
    openContainers: false,
    pvp: true,
    owners: [],
  }

  protected onCreate(): void {
    this.saveStructure()
  }
}
registerRegionKind(BaseRegion)
