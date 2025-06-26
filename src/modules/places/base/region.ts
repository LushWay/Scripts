import { Player } from '@minecraft/server'
import { disableAdventureNear } from 'lib'
import { i18n, noI18n } from 'lib/i18n/text'
import { SphereArea } from 'lib/region/areas/sphere'
import { registerRegionType } from 'lib/region/command'
import { registerSaveableRegion } from 'lib/region/database'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { getSafeFromRottingTime, materialsToRString } from './actions/rotting'
import { baseLevels } from './base-levels'

interface BaseLDB extends JsonObject {
  level: number
  materials: Readonly<Record<string, number>>
  materialsMissing: Readonly<Record<string, number>>
  barrel: Readonly<Record<string, number>>
  toTakeFromBarrel: Readonly<Record<string, number>>
  state: RottingState
}

export enum RottingState {
  No = 0,
  Destroyed = 1,
  NoMaterials = 2,
}

const MAX_RADIUS = 30

export class BaseRegion extends RegionWithStructure {
  protected onCreate(): void {
    // Save structure with bigger radius for future upgrading
    const radius = this.area.radius
    try {
      if (this.area instanceof SphereArea) this.area.radius = MAX_RADIUS
      this.structure.save()
    } catch (e) {
    } finally {
      if (this.area instanceof SphereArea) this.area.radius = radius
      this.onRestore()
    }
  }

  protected onRestore(): void {
    this.updateRadius()
    this.structure.offset = MAX_RADIUS - this.area.radius
  }

  baseMemberText(player: Player) {
    let text
    if (this.ldb.state === RottingState.NoMaterials) text = i18n.error`(гниет)`
    if (this.ldb.state === RottingState.Destroyed) text = i18n.error`(разрушена)`
    if (this.ldb.state === RottingState.No) text = getSafeFromRottingTime(this)
    return i18n.nocolor`§6Ваша база ${text}`.to(player.lang)
  }

  updateRadius() {
    const upgrade = baseLevels[this.ldb.level]
    if (typeof upgrade === 'undefined') return
    if (this.area instanceof SphereArea) this.area.radius = upgrade.radius
    this.save()
  }

  ldb: BaseLDB = {
    level: 1,
    materials: {},
    materialsMissing: {},
    barrel: {},
    toTakeFromBarrel: {},
    state: RottingState.No,
  }

  customFormDescription(player: Player): Text.Table {
    return [
      ...super.customFormDescription(player),
      ['Level', RottingState[this.ldb.level]],
      ['State', RottingState[this.ldb.state]],
      ['Materials', materialsToRString(this.ldb.materials, player)],
      ['Materials missing', materialsToRString(this.ldb.materialsMissing, player)],
      ['Barrel', materialsToRString(this.ldb.barrel, player)],
      ['To take', materialsToRString(this.ldb.toTakeFromBarrel, player)],
    ]
  }
}

registerSaveableRegion('base', BaseRegion)
registerRegionType(noI18n`Базы`, BaseRegion)
disableAdventureNear.push(BaseRegion)
