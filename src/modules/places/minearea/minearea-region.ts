import { Player, PlayerBreakBlockBeforeEvent } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'
import { actionGuard, ActionGuardOrder, registerCreateableRegion } from 'lib/region'
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
    pvp: 'pve',
    trapdoors: true,
    doors: true,
    gates: true,
    switches: true,
    openContainers: true,
    allowedAllItem: true,
    owners: [],
  }

  async restoreAndSaveStructure(eachVectorCallback?: (vector: Vector3) => void) {
    const restoredRegions: MineareaRegion[] = []
    await this.area
      .forEachVector(async (vector, isIn) => {
        if (!isIn) return

        eachVectorCallback?.(vector)

        const regions = Region.getManyAt({ vector, dimensionType: this.dimensionType })
        for (const region of regions) {
          // Prevent from region save conflicts
          if (region instanceof MineareaRegion && !restoredRegions.includes(region) && region !== this) {
            restoredRegions.push(region)
            await region.structure.place()
          }
        }
      })
      .then(() => this.structure.save())

    return restoredRegions.length
  }

  protected async onCreate() {
    const crossRegions = await this.restoreAndSaveStructure()

    logger.info`Created new MineArea region ${this.id} and saved structure. Crossregions restored: ${crossRegions}`
  }

  onBlockBreak(_player: Player, event: PlayerBreakBlockBeforeEvent) {
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

registerSaveableRegion('minearea', MineareaRegion)
registerCreateableRegion('Зоны добычи', MineareaRegion)

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

export function onFullRegionTypeRestore<T extends typeof Region>(
  regionType: T,
  callback: (region: InstanceType<T>) => void,
) {
  onScheduledBlockPlace.subscribe(({ block, schedules, schedule }) => {
    const regions = regionType.getManyAt<InstanceType<T>>(block)
    for (const region of regions) {
      const dimensionType = block.dimension.type
      const toRestore = schedules.filter(e => region.area.isIn({ vector: e.location, dimensionType }) && e !== schedule)
      if (toRestore.length) continue

      callback(region)
    }
  })
}

onFullRegionTypeRestore(MineareaRegion, region => {
  logger.info`All blocks in region ${region.name} kind ${region.creator.kind} are restored.`
  region.structure.place()
})
