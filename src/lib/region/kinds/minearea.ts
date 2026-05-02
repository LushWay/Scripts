import { ItemStack, Player, PlayerBreakBlockBeforeEvent, ShortcutDimensions, system } from '@minecraft/server'
import { NewFormCreator } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { registerSaveableRegion } from 'lib/region/database'
import {
  actionGuard,
  ActionGuardOrder,
  disableAdventureNear,
  regionTypesThatIgnoreIsBuildingGuard,
  registerRegionType,
} from 'lib/region/index'
import { Region, type RegionPermissions } from 'lib/region/kinds/region'
import { RegionWithStructure } from 'lib/region/kinds/with-structure'
import { isNewbie } from 'lib/rpg/newbie'
import { ItemResource, ResourceLocationRegion, ResourcesSource } from 'lib/rpg/resource-source'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { isNotPlaying } from 'lib/utils/game'
import { createLogger } from 'lib/utils/logger'
import { ms } from 'lib/utils/ms'
import { Vec } from 'lib/vector'
import { Area } from '../areas/area'

const logger = createLogger('Minearea')

interface MineareaRegionLDB extends JsonObject {
  resources: { typeId: string; amount: number }[]
}

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

  ldb: MineareaRegionLDB = {
    resources: [],
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
    return (this.restoringStructureProgress / Vec.size({ x: 0, y: 0, z: 0 }, this.area.size)) * 100
  }

  private restoringStructurePromise: Promise<MineareaRegion[]> | undefined

  restoreStructure(eachVectorCallback: ((vector: Vector3) => void) | undefined): Promise<MineareaRegion[]> {
    if (this.restoringStructurePromise) return this.restoringStructurePromise

    const { promise, resolve, reject } = Promise.withResolvers<MineareaRegion[]>()
    this.restoringStructurePromise = promise

    this.restoreStructureImpl(eachVectorCallback)
      .then(resolve)
      .catch((err: unknown) => {
        logger.error('MineareaRegion.restoreStructure', err)
        reject(err)
      })
      .finally(() => {
        this.restoringStructurePromise = undefined
      })

    return promise
  }

  private async restoreStructureImpl(eachVectorCallback: ((vector: Vector3) => void) | undefined) {
    const restoredRegions: MineareaRegion[] = []
    try {
      await this.area.forEachVector(async (vector, isIn) => {
        if (!isIn) return

        for (const region of MineareaRegion.getManyAt({ location: vector, dimensionType: this.dimensionType })) {
          // Prevent from region save conflicts
          if (!restoredRegions.includes(region) && region !== this) {
            restoredRegions.push(region)
            if (region.structure.exists) await region.structure.place()
          }
        }

        this.restoringStructureProgress++
        eachVectorCallback?.(vector)
      }, 500)

      this.deleteSchedules()
      return restoredRegions
    } finally {
      this.restoringStructureProgress = 0
    }
  }

  deleteSchedules() {
    const dimensionType = this.dimensionType
    this.scheduledToPlaceBlocks.forEach(e => ScheduleBlockPlace.deleteAt(e, dimensionType))
    this.scheduledToPlaceBlocks = []
  }

  protected async onCreate(action = 'Created new') {
    logger.info`${action} ${this.creator.name} region...`
    const crossRegions = await this.restoreAndResaveStructure()

    logger.info`${action} ${this.creator.name} region ${this.id} and saved structure. Crossregions restored: ${crossRegions}`
  }

  protected async onRestore() {
    if (!this.structure.exists) await this.onCreate('Restored')

    this.scheduledToPlaceBlocks = await getSchedules(this.area, this.dimensionType)
  }

  building = false

  scheduledToPlaceBlocks: string[] = []

  newbie = false

  onBlockBreak(_player: Player, event: PlayerBreakBlockBeforeEvent) {
    const schedule = ScheduleBlockPlace.setBlock(event.block, ms.from('sec', 10))
    this.scheduledToPlaceBlocks.push(Vec.string(schedule.l)) //  ms.from('min', Math.randomInt(1, 3))

    return true
  }

  get displayName(): Text {
    return this.newbie ? i18n.nocolor`§bЗона добычи новичков` : i18n.nocolor`§7Зона добычи`
  }

  customFormDescription(player: Player): Text.Table {
    return [
      ['Building', this.building],
      ['Restoring structure', this.restoringStructureProgress],
      ['Scheduled to place blocks', this.scheduledToPlaceBlocks.length],
      ['Newbie', this.newbie],
      ['Resource types', this.ldb.resources.length],
    ]
  }

  resources = new ResourcesSource()

  async indexResources() {
    const blockTypeToItem = new Map<string, string>()
    const amounts = new Map<string, number>()

    await this.structure.forEachBlock((_, block) => {
      if (!block) return

      const key = blockTypeToItem.getOrInsertComputed(block.type.id, () => block.getItemStack()?.typeId ?? '')
      amounts.set(key, amounts.getOrInsert(key, 0) + 1)
    })

    this.ldb.resources = [...amounts].map(([typeId, amount]) => ({ typeId, amount }))
    this.save()
  }

  addResourcesFromIndex() {
    this.resources.delete()
    this.resources = new ResourcesSource()

    const place = Region.getOrCreatePlace(this, 'minearea')
    const location = new ResourceLocationRegion(place, this)
    this.resources.addLocation(location)
    for (const resource of this.ldb.resources) {
      this.resources.add(
        new ItemResource(new ItemStack(resource.typeId)).setDescription(i18n`Макс кол-во: ${resource.amount}`),
      )
    }
  }

  customFormButtons(form: NewFormCreator, player: Player): void {
    form.button('Индексировать для вики', () => {
      player.info('Start')
      this.indexResources()
        .then(() => player.success())
        .catch((error: unknown) => {
          player.fail(`Indexing failed: ${error}`)
          logger.error('Indexing failed', error)
        })
    })
  }
}

registerSaveableRegion('minearea', MineareaRegion)
registerRegionType(noI18n`Зоны добычи`, MineareaRegion)

regionTypesThatIgnoreIsBuildingGuard.push(MineareaRegion)

async function getSchedules(area: Area, dimensionType: ShortcutDimensions) {
  const schedules: string[] = []
  await area.forEachVector((location, isIn) => {
    if (!isIn) return

    const schedule = ScheduleBlockPlace.has(location, dimensionType)
    if (schedule) schedules.push(schedule)
  }, 50)
  return schedules
}

actionGuard((player, region, ctx) => {
  if (!(region instanceof MineareaRegion)) return

  if (region.newbie && !isNewbie(player))
    return player.fail(i18n.error`Вы не можете добывать блоки в зоне добычи новичков`)

  const building = isNotPlaying(player)

  if (region.building && !building) return player.fail(i18n.error`Регион сохраняется`)
  if (region.creating && !building)
    return player.fail(i18n.error`Регион создается. ${~~region.restoringStructurePercent}%%`)

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
        const schedule = ScheduleBlockPlace.setBlock(ctx.event.block, ms.from('sec', 10))
        region.scheduledToPlaceBlocks.push(Vec.string(schedule.l))

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
  if (typeof regionType === 'undefined') {
    logger.warn(new Error('Undefined regionType'))
    return
  }
  const hadSchedules = new Set<InstanceType<T>>()

  timeout()
  function timeout() {
    system.runTimeout(
      async () => {
        try {
          if (ScheduleBlockPlace.getSize() !== 0) {
            for (const region of regionType.getAll<InstanceType<T>>()) {
              const dimensionType = region.dimensionType
              const toRestore = await getSchedules(region.area, dimensionType)

              if (region instanceof MineareaRegion) region.scheduledToPlaceBlocks = toRestore
              if (toRestore.length) {
                hadSchedules.add(region)
              } else {
                if (hadSchedules.has(region)) {
                  hadSchedules.delete(region)
                  callback(region)
                }
              }
            }
          }
        } catch (e) {
          logger.error(e)
        } finally {
          timeout()
        }
      },
      'onFullregionTypeRestore ' + regionType.kind,
      100,
    )
  }
}

onFullRegionTypeRestore(MineareaRegion, region => {
  if (region.structure.exists) {
    logger.info`All blocks in region ${region.name} kind ${region.creator.kind} are restored.`

    region.deleteSchedules()
    region.structure.place()
  } else {
    logger.warn`All blocks in region ${region.name} kind ${region.creator.kind} are restored. BUT NO STRUCTURE EXISTS`
  }
})

function notifyBuilder(player: Player, region: MineareaRegion) {
  if (region.scheduledToPlaceBlocks.length || region.creating) {
    system.delay(() => {
      player.fail(
        noI18n.error`Изменения в этом регионе не сохранятся т.к. будет загружена структура. Подождите завершения загрузки. ${
          region.creating ? noI18n`Сохранение структуры...` : `${~~region.restoringStructurePercent}%%`
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
