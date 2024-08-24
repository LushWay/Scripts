import { Player, PlayerBreakBlockBeforeEvent } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'
import { actionGuard, addAddableRegion } from 'lib/region'
import { registerRegionKind } from 'lib/region/database'
import { Region, type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { t } from 'lib/text'
import { ms } from 'lib/utils/ms'
import { onScheduledBlockPlace, scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

export class MineareaRegion extends RegionWithStructure {
  static readonly kind: string = 'minearea'

  /** MineArea is more prior then other regions */
  protected readonly priority = 1

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    doorsAndSwitches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  protected onCreate(): void {
    this.saveStructure()
    console.log('Created new MineArea region and saved structure')
  }

  onBlockBreak(player: Player, event: PlayerBreakBlockBeforeEvent) {
    const { block, dimension } = event
    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: block.typeId,
      states: block.permutation.getAllStates(),
      restoreTime: ms.from('sec', 10), // ms.from('min', Math.randomInt(1, 3)),
    })
    console.log('ON BLOCK BREAK MINEAREA')

    return true
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  get displayName() {
    return '§7Зона добычи'
  }
}

addAddableRegion('Зоны добычи', MineareaRegion)
registerRegionKind(MineareaRegion)

actionGuard((player, region, ctx) => {
  if (isNotPlaying(player)) return
  if (!(region instanceof MineareaRegion)) return

  switch (ctx.type) {
    case 'interactWithBlock':
    case 'interactWithEntity':
      return true

    case 'break': {
      return region.onBlockBreak(player, ctx.event)
    }

    case 'place': {
      const { block, dimension } = ctx.event
      scheduleBlockPlace({
        dimension: dimension.type,
        location: block.location,
        typeId: block.typeId,
        states: block.permutation.getAllStates(),
        restoreTime: ms.from('min', Math.randomInt(3, 10)),
      })

      return true
    }
  }
})

onScheduledBlockPlace.subscribe(({ block, schedules, schedule }) => {
  const regions = Region.nearestRegions(block, block.dimension.type)
  for (const region of regions) {
    if (!(region instanceof MineareaRegion)) continue

    const toRestore = schedules.filter(e => region.area.isVectorIn(e.location, region.dimensionId) && e !== schedule)
    if (toRestore.length) {
      // console.log(t`Still blocks to restore: ${toRestore.length}`)
      continue
    }

    console.log(t`All blocks in region ${region.name} kind ${region.creator.kind} are restored.`)
    region.loadStructure()
  }
})
