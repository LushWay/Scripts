import { addAddableRegion } from 'lib/region/command'
import { registerSaveableRegion } from 'lib/region/database'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'

// TODO Base levels, shadow regions after removing etc

export class BaseRegion extends RegionWithStructure {
  protected onCreate(): void {
    this.saveStructure()
  }
}
registerSaveableRegion('base', BaseRegion)
addAddableRegion('Базы', BaseRegion)
