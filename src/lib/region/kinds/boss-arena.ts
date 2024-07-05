import { RadiusRegion, RadiusRegionOptions } from './radius'
import { type RegionPermissions } from './region'

interface BossArenaRegionOptions extends RadiusRegionOptions {
  bossName: string
}

export class BossArenaRegion extends RadiusRegion {
  static readonly kind = 'boss'

  protected readonly saveable = false

  radius = 40

  protected priority = 10

  bossName: string

  get displayName(): string | undefined {
    return `§cБосс §6${this.bossName}`
  }

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  constructor(options: BossArenaRegionOptions, key: string) {
    super(options, key)
    this.bossName = options.bossName
  }
}
