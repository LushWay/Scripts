import { Player, PlayerBreakBlockBeforeEvent, system } from '@minecraft/server'
import { isNotPlaying } from 'lib/game-utils'
import { registerSaveableRegion } from 'lib/region/database'
import {
  actionGuard,
  ActionGuardOrder,
  disableAdventureNear,
  regionTypesThatIgnoreIsBuildingGuard,
  registerCreateableRegion,
} from 'lib/region/index'
import { Region, type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import {
  getScheduledToPlaceAsync,
  onScheduledBlockPlace,
  scheduleBlockPlace,
  ScheduledBlockPlace,
  unscheduleBlockPlace,
} from 'lib/scheduled-block-place'
import { t } from 'lib/text'
import { createLogger } from 'lib/utils/logger'
import { ms } from 'lib/utils/ms'
import { Vector } from 'lib/vector'

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

  async restoreAndResaveStructure(eachVectorCallback?: (vector: Vector3) => void) {
    try {
      this.creating = true
      const restoredRegions: MineareaRegion[] = await this.restoreStructure(eachVectorCallback)

      this.structure.delete()
      await this.structure.save()

      return restoredRegions.length
    } finally {
      this.creating = false
    }
  }

  creating = false

  private restoringStructureProgress = 0

  get restoringStructurePercent() {
    return (this.restoringStructureProgress / Vector.size({ x: 0, y: 0, z: 0 }, this.area.size)) * 100
  }

  private restoringStructurePromise: Promise<MineareaRegion[]> | undefined

  async restoreStructure(eachVectorCallback: ((vector: Vector3) => void) | undefined) {
    if (this.restoringStructurePromise) return this.restoringStructurePromise

    this.restoringStructurePromise = new Promise((resolve, reject) => {
      const restoredRegions: MineareaRegion[] = []
      this.area
        .forEachVector(async (vector, isIn) => {
          if (!isIn) return

          const regions = Region.getManyAt({ vector, dimensionType: this.dimensionType })
          for (const region of regions) {
            // Prevent from region save conflicts
            if (region instanceof MineareaRegion && !restoredRegions.includes(region) && region !== this) {
              restoredRegions.push(region)
              await region.structure.place()
            }
          }

          this.restoringStructureProgress++
          eachVectorCallback?.(vector)
        })
        .then(() => {
          this.scheduledToPlaceBlocks.forEach(e => unscheduleBlockPlace(e))
          this.scheduledToPlaceBlocks = []
          resolve(restoredRegions)
        })
        .finally(() => (this.restoringStructureProgress = 0))
        .catch((e: unknown) => reject(e as Error))
    })
    const result = await this.restoringStructurePromise
    delete this.restoringStructurePromise
    return result
  }

  protected async onCreate(action = 'Created new') {
    logger.info`${action} ${this.creator.name} region...`
    const crossRegions = await this.restoreAndResaveStructure()

    logger.info`${action} ${this.creator.name} region ${this.id} and saved structure. Crossregions restored: ${crossRegions}`
  }

  protected async onRestore() {
    if (!this.structure.exists) await this.onCreate('Restored')

    const vectors: Vector3[] = []
    await this.area.forEachVector((vector, isIn) => {
      if (!isIn) return

      vectors.push(vector)
    }, 1000)

    const scheduled = await getScheduledToPlaceAsync(vectors, this.dimension.type)
    if (scheduled) this.scheduledToPlaceBlocks = scheduled
  }

  building = false

  scheduledToPlaceBlocks: Immutable<ScheduledBlockPlace>[] = []

  onBlockBreak(_player: Player, event: PlayerBreakBlockBeforeEvent) {
    const { block, dimension } = event
    const schedule = scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: block.typeId,
      states: block.permutation.getAllStates(),
      restoreTime: ms.from('sec', 10), // ms.from('min', Math.randomInt(1, 3)),
    })
    this.scheduledToPlaceBlocks.push(schedule)

    return true
  }

  get displayName() {
    return '§7Зона добычи'
  }

  customFormDescription(player: Player): Record<string, unknown> {
    return {
      'Building': this.building,
      'Restoring structure': this.restoringStructureProgress,
      'Scheduled to place blocks': this.scheduledToPlaceBlocks.length,
    }
  }
}

registerSaveableRegion('minearea', MineareaRegion)
registerCreateableRegion('Зоны добычи', MineareaRegion)

regionTypesThatIgnoreIsBuildingGuard.push(MineareaRegion)

actionGuard((player, region, ctx) => {
  if (!(region instanceof MineareaRegion)) return

  const building = isNotPlaying(player)

  if (region.building && !building) return player.fail('Регион сохраняется')
  if (region.creating && !building)
    return player.fail(t.error`Регион создается. ${~~region.restoringStructurePercent}%%`)

  switch (ctx.type) {
    case 'interactWithBlock':
    case 'interactWithEntity':
      if (!building) return true
      else return notifyBuilder(player, region)

    case 'break': {
      if (!building) return region.onBlockBreak(player, ctx.event)
      else return notifyBuilder(player, region)
    }

    case 'place': {
      if (!building) {
        const { block, dimension } = ctx.event
        const schedule = scheduleBlockPlace({
          dimension: dimension.type,
          location: block.location,
          typeId: block.typeId,
          states: block.permutation.getAllStates(),
          restoreTime: ms.from('min', Math.randomInt(3, 10)),
        })

        region.scheduledToPlaceBlocks.push(schedule)

        return true
      } else return notifyBuilder(player, region)
    }
  }
}, ActionGuardOrder.Lowest)

disableAdventureNear.push(MineareaRegion)

export function onFullRegionTypeRestore<T extends typeof Region>(
  regionType: T,
  callback: (region: InstanceType<T>) => void,
) {
  onScheduledBlockPlace.subscribe(({ block, schedules, schedule }) => {
    const regions = regionType.getManyAt<InstanceType<T>>(block)
    for (const region of regions) {
      const dimensionType = block.dimension.type
      const toRestore = schedules.filter(e => region.area.isIn({ vector: e.location, dimensionType }) && e !== schedule)
      if (region instanceof MineareaRegion) region.scheduledToPlaceBlocks = toRestore
      if (toRestore.length) continue

      callback(region)
    }
  })
}

onFullRegionTypeRestore(MineareaRegion, region => {
  logger.info`All blocks in region ${region.name} kind ${region.creator.kind} are restored.`
  region.scheduledToPlaceBlocks = []
  region.structure.place()
})

function notifyBuilder(player: Player, region: MineareaRegion) {
  if (region.scheduledToPlaceBlocks.length || region.creating) {
    system.delay(() => {
      player.fail(
        t.error`Изменения в этом регионе не сохранятся т.к. будет загружена структура. Подождите завершения загрузки. ${
          region.creating ? 'Сохранение структуры...' : `${~~region.restoringStructurePercent}%%`
        }`,
      )
      region.restoreStructure(() => void 0)
    })

    return false
  } else {
    region.building = true
    system.delay(async () => {
      try {
        region.structure.delete()
        await region.structure.save()
      } finally {
        region.building = false
      }
    })
    return true
  }
}
