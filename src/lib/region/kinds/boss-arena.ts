import { Area } from '../areas/area'
import { Region, RegionCreationOptions, type RegionPermissions } from './region'

interface BossArenaRegionOptions extends RegionCreationOptions {
  bossName: string
}

export class BossArenaRegion extends Region {
  protected priority = 10

  bossName: string

  get displayName(): string | undefined {
    return `§cБосс §6${this.bossName}`
  }

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    trapdoors: false,
    doors: false,
    gates: false,
    switches: false,
    openContainers: true,
    pvp: 'pve',
    owners: [],
  }

  constructor(area: Area, options: BossArenaRegionOptions, key: string) {
    super(area, options, key)
    this.bossName = options.bossName
  }
}
