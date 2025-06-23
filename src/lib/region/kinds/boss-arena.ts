import { Entity, Player } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { ActionForm } from 'lib/form/action'
import { registerRegionType } from 'lib/region/command'
import { adventureModeRegions } from 'lib/region/kinds/safe-area'
import { Boss } from 'lib/rpg/boss'
import { l, t } from 'lib/text'
import { Vec } from 'lib/vector'
import { Area } from '../areas/area'
import { Region, RegionCreationOptions, type RegionPermissions } from './region'

interface BossArenaRegionOptions extends RegionCreationOptions {
  bossName: string

  boss?: Boss
}

export class BossArenaRegion extends Region {
  protected priority = 10

  bossName: string

  boss?: Boss

  get displayName(): string | undefined {
    return t.nocolor`§cБосс §6${this.bossName}`
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
    allowedAllItem: true,
  }

  constructor(area: Area, options: BossArenaRegionOptions, key: string) {
    super(area, options, key)
    this.bossName = options.bossName
    this.boss = options.boss
  }

  returnEntity(entity: Entity, center = this.area.center) {
    const location = entity.location
    const horizontal = Vec.distance({ x: location.x, y: 0, z: location.z }, { x: center.x, y: 0, z: center.z }) / 10
    const vertical = Math.abs(location.y - center.y) / 10
    const vector = Vec.subtract(location, center)
    entity.applyKnockback(Vec.multiply(vector.normalized(), -horizontal), vertical)
  }

  onSave = new EventSignal()

  save(): false | undefined {
    EventSignal.emit(this.onSave, {})
    return
  }

  customFormButtons(form: ActionForm, player: Player): void {
    form.addButton(l`Вызвать босса`, () => {
      if (this.boss) Boss.db.delete(this.boss.id)
    })
  }
}
registerRegionType('Boss Region', BossArenaRegion, false)
adventureModeRegions.push(BossArenaRegion)
