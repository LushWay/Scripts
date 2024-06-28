import { RadiusRegion } from './radius'
import { type RegionPermissions } from './region'

export class BossArenaRegion extends RadiusRegion {
  static readonly kind = 'boss'

  protected readonly saveable = false

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }
}
