import { addAddableRegion } from 'lib/region/command'
import { registerRegionKind } from 'lib/region/database'
import { type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'

// TODO Base levels, shadow regions after removing etc

export class BaseRegion extends RegionWithStructure {
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
addAddableRegion('Базы', BaseRegion)
