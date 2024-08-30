import { Player, PlayerBreakBlockBeforeEvent } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'
import { actionGuard, ActionGuardOrder, addAddableRegion } from 'lib/region'
import { registerSaveableRegion } from 'lib/region/database'
import { Region, type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { createLogger } from 'lib/utils/logger'
import { ms } from 'lib/utils/ms'
import { onScheduledBlockPlace, scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

const logger = createLogger('Minearea')

export class MineareaRegion extends RegionWithStructure {
  /** MineArea is more prior then other regions */
  protected readonly priority = 1

  protected readonly defaultPermissions: RegionPermissions = {
    allowedEntities: 'all',
    trapdoors: true,
    doors: true,
    switches: true,
    openContainers: true,
    pvp: true,
    owners: [],
  }

  async restoreAndSaveStructure(eachVectorCallback?: (vector: Vector3) => void) {
    const restoredRegions: MineareaRegion[] = []
    await this.area
      .forEachVector(async (vector, isIn) => {
        if (!isIn) return

        eachVectorCallback?.(vector)

        const regions = Region.nearestRegions(vector, this.dimensionId)
        for (const region of regions) {
          // Prevent from region save conflicts
          if (region instanceof MineareaRegion && !restoredRegions.includes(region) && region !== this) {
            restoredRegions.push(region)
            await region.loadStructure()
          }
        }
      })
      .then(() => {
        super.saveStructure()
      })

    return restoredRegions.length
  }

  protected async onCreate() {
    const crossRegions = await this.saveStructure()

    logger.info`Created new MineArea region ${this.key} and saved structure. Crossregions restored: ${crossRegions}`
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

    return true
  }

  get displayName() {
    return '§7Зона добычи'
  }
}

addAddableRegion('Зоны добычи', MineareaRegion)
registerSaveableRegion('minearea', MineareaRegion)

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
}, ActionGuardOrder.Lowest)

onScheduledBlockPlace.subscribe(({ block, schedules, schedule }) => {
  const regions = Region.nearestRegions(block, block.dimension.type)
  for (const region of regions) {
    if (!(region instanceof MineareaRegion)) continue

    const toRestore = schedules.filter(e => region.area.isVectorIn(e.location, region.dimensionId) && e !== schedule)
    if (toRestore.length) {
      // logger.debug`Still blocks to restore: ${toRestore.length}`
      continue
    }

    logger.info`All blocks in region ${region.name} kind ${region.creator.kind} are restored.`
    region.loadStructure()
  }
})
