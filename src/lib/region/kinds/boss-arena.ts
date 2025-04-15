import { Entity } from '@minecraft/server'
import { Vector } from 'lib/vector'
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
    allowedAllItem: false,
  }

  constructor(area: Area, options: BossArenaRegionOptions, key: string) {
    super(area, options, key)
    this.bossName = options.bossName
  }

  returnEntity(entity: Entity) {
    const center = this.area.center
    const location = entity.location
    const horizontal = Vector.distance({ x: location.x, y: 0, z: location.z }, { x: center.x, y: 0, z: center.z }) / 10
    const vertical = Math.abs(location.y - center.y) / 10
    const vector = Vector.subtract(location, center)
    entity.applyKnockback(Vector.multiply(vector.normalized(), horizontal), vertical)
  }
}
