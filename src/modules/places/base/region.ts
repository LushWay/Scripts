import { Player } from '@minecraft/server'
import { disableAdventureNear, rawTextToString } from 'lib'
import { SphereArea } from 'lib/region/areas/sphere'
import { registerRegionType } from 'lib/region/command'
import { registerSaveableRegion } from 'lib/region/database'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { getSafeFromRottingTime, materialsToRawText } from './actions/rotting'
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

  baseMemberText() {
    let text = '§6Ваша база'
    if (this.ldb.state === RottingState.NoMaterials) text += ' §c(гниет)'
    if (this.ldb.state === RottingState.Destroyed) text += ' §c(разрушена)'
    if (this.ldb.state === RottingState.No) text += ` ${getSafeFromRottingTime(this)}`
    return text
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

  customFormDescription(player: Player): Record<string, unknown> {
    return {
      ...super.customFormDescription(player),
      'Level': RottingState[this.ldb.level],
      'State': RottingState[this.ldb.state],
      'Materials': rawTextToString(materialsToRawText(this.ldb.materials), player.lang),
      'Materials missing': rawTextToString(materialsToRawText(this.ldb.materialsMissing), player.lang),
      'Barrel': rawTextToString(materialsToRawText(this.ldb.barrel), player.lang),
      'To take': rawTextToString(materialsToRawText(this.ldb.toTakeFromBarrel), player.lang),
    }
  }
}

registerSaveableRegion('base', BaseRegion)
registerRegionType('Базы', BaseRegion)
disableAdventureNear.push(BaseRegion)
