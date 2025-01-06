import { Block, BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { EventSignal } from 'lib/event-signal'
import { form } from 'lib/form/new'
import { t } from 'lib/text'
import { util } from 'lib/util'
import { createLogger } from 'lib/utils/logger'
import { Vector } from 'lib/vector'

interface ScheduledBlockPlace {
  typeId: string
  states?: Record<string, string | number | boolean>
  date: number
  location: Vector3
}

export const SCHEDULED_DB = table<ScheduledBlockPlace[]>('ScheduledBlockPlace', () => []) as Record<
  DimensionType,
  ScheduledBlockPlace[]
>

export function scheduleBlockPlace({
  dimension,
  restoreTime,
  ...options
}: Omit<ScheduledBlockPlace, 'date'> & {
  dimension: DimensionType
  restoreTime: number
}) {
  if (!isScheduledToPlace(options.location, dimension))
    SCHEDULED_DB[dimension].push({ date: Date.now() + restoreTime, ...options })
}

export function getScheduledToPlace(location: Vector3, dimension: DimensionType) {
  const dimblocks = IMMUTABLE_DB[dimension]
  if (typeof dimblocks === 'undefined') return false

  return dimblocks.find(e => Vector.equals(e.location, location))
}

/** Checks whenether provided location in dimension has scheduled blocks */
export function isScheduledToPlace(location: Vector3, dimension: DimensionType) {
  return !!getScheduledToPlace(location, dimension)
}

/** Event that triggers when scheduled block is being placed */
export const onScheduledBlockPlace = new EventSignal<{
  schedule: Readonly<ScheduledBlockPlace>
  block: Block
  dimensionType: DimensionType
  schedules: readonly ScheduledBlockPlace[]
}>()

const UNSCHEDULED = -1

/**
 * Cancels scheduled block place by setting its date to -1
 *
 * @param schedule - Schedule to be canceled
 */
export function unscheduleBlockPlace(schedule: ScheduledBlockPlace) {
  schedule.date = UNSCHEDULED
}

const logger = createLogger('SheduledPlace')

// If we will not use immutable unproxied value,
// proxy wrapper will convert all values into subproxies
// which is too expensive when arrays are very big
const IMMUTABLE_DB = ProxyDatabase.immutableUnproxy(SCHEDULED_DB)

const DIMENSIONS = ['overworld', 'nether', 'end'] as const

function* scheduledBlockPlaceJob() {
  for (const dimension of DIMENSIONS) {
    const schedules = IMMUTABLE_DB[dimension]
    if (typeof schedules === 'undefined') {
      Reflect.deleteProperty(SCHEDULED_DB, dimension)
      continue
    }

    const time = util.benchmark('dimension', 'sc')

    // The direction is reversed because we are mutating
    // the array that we are iterating thro
    for (let i = schedules.length - 1; i >= 0; i--) {
      try {
        const schedule = schedules[i]
        const block = getScheduleBlock(schedule, i, dimension, schedules)
        if (!block) {
          yield
          continue
        }

        block.setPermutation(BlockPermutation.resolve(schedule.typeId, schedule.states))

        if (__DEV__ || (schedules.length - 1) % 100 === 0)
          logger.info`${schedule.typeId.replace('minecraft:', '')} to ${schedule.location}, remains ${schedules.length - 1}`

        EventSignal.emit(onScheduledBlockPlace, { schedule, block, schedules, dimensionType: dimension })
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) {
          yield
          continue
        } else logger.error`Unable to place: ${e}`
      }

      // Remove successfully placed block from the schedule array
      removeScheduleAt(dimension, i)
      yield
    }

    time()
    timeout()
  }
}

function timeout() {
  system.runTimeout(() => system.runJob(scheduledBlockPlaceJob()), 'scheduled block place', 10)
}
timeout()

function removeScheduleAt(dimension: DimensionType, i: number) {
  SCHEDULED_DB[dimension].splice(i, 1)
}

function getScheduleBlock(
  schedule: Readonly<ScheduledBlockPlace>,
  i: number,
  dimension: DimensionType,
  schedules: readonly ScheduledBlockPlace[],
) {
  if (typeof schedule === 'undefined' || schedule.date === UNSCHEDULED) return removeScheduleAt(dimension, i)

  let date = schedule.date
  if (date !== 0) {
    if (schedules.length > 500) {
      date -= ~~(schedules.length / 500)
    }
    if (Date.now() < date) return

    // To prevent blocks from restoring randomly in air
    // we calculate if there is near broken block
    const nearAir = schedules.find(
      e => e !== schedule && Vector.distance(e.location, schedule.location) <= 1 && e.date > date,
    )
    if (nearAir) return
  }

  const block = world.overworld.getBlock(schedule.location)
  if (!block?.isValid()) return

  return block
}

const scheduleForm = form(form => {
  form.title('schd')
  for (const [dim, blocks] of Object.entries(SCHEDULED_DB)) {
    form.button(scheduledDimensionForm(dim, blocks))
  }
})

const scheduledDimensionForm = (dim: string, blocks: ScheduledBlockPlace[]) =>
  form((form, player) => {
    const size = blocks.length
    form.title(`§7${dim}: §f${size}`)
    form.button(t`Place all blocks NOW`, () => {
      player.success(`Enjoy the CHAOS. Force-placed ${size} blocks.`)
      system.runJobForEach(blocks, e => (e.date = 0))
    })
    const first = blocks[0]
    if (typeof first === 'undefined') return
    form.button(t`TP to first: ${Vector.string(first.location, true)}\n${first.typeId}`, () => {
      player.teleport(first.location)
      player.success()
    })
  })

new Command('schd')
  .setDescription('Отложенная установка блоков')
  .setPermissions('techAdmin')
  .executes(ctx => scheduleForm.show(ctx.player))
