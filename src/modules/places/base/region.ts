import { actionGuard, ActionGuardOrder, disableAdventureNear, isNotPlaying, Vector } from 'lib'
import { SphereArea } from 'lib/region/areas/sphere'
import { registerRegionType } from 'lib/region/command'
import { registerSaveableRegion } from 'lib/region/database'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'

interface BaseLDB extends JsonObject {
  level: number
  materials: Readonly<Record<string, number>>
  materialsMissing: Readonly<Record<string, number>>
  barrel: Readonly<Record<string, number>>
  toTakeFromBarrel: Readonly<Record<string, number>>
  isRotting: boolean
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
    this.structure.offset = MAX_RADIUS - this.area.radius
  }

  ldb: BaseLDB = {
    level: 1,
    materials: {},
    materialsMissing: {},
    barrel: {},
    toTakeFromBarrel: {},
    isRotting: false,
  }
}

actionGuard((player, base, ctx) => {
  if (!(base instanceof BaseRegion) || isNotPlaying(player) || !base.isMember(player.id)) return

  if (base.ldb.isRotting) {
    if (
      (ctx.type === 'interactWithBlock' || ctx.type === 'place') &&
      Vector.equals(ctx.event.block.location, base.area.center)
    ) {
      // Allow interacting with base block or placing
      return true
    }

    // TODO Say how to fix rotting
    player.fail('База гниет!')
    return false
  }
}, ActionGuardOrder.BlockAction)

registerSaveableRegion('base', BaseRegion)
registerRegionType('Базы', BaseRegion)
disableAdventureNear.push(BaseRegion)
