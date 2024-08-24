import { Block, BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { EventSignal, Vector, util } from 'lib'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { t } from 'lib/text'

interface ScheduledBlockPlace {
  typeId: string
  states?: Record<string, string | number | boolean>
  date: number
  location: Vector3
}

export const SCHEDULED_DB = table<ScheduledBlockPlace[]>('ScheduledBlockPlace', () => []) as Record<
  Dimensions,
  ScheduledBlockPlace[]
>

// TODO Меню с кол-вом отложенных блоков
// TODO Кнопка "поставить все отложенные блоки"
export function scheduleBlockPlace({
  dimension,
  restoreTime,
  ...options
}: Omit<ScheduledBlockPlace, 'date'> & {
  dimension: Dimensions
  restoreTime: number
}) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const other = IMMUTABLE_DB[dimension]?.find(e => Vector.equals(e.location, options.location))

  if (!other) SCHEDULED_DB[dimension].push({ date: Date.now() + restoreTime, ...options })
}

export const onScheduledBlockPlace = new EventSignal<{
  schedule: Readonly<ScheduledBlockPlace>
  block: Block
  schedules: readonly ScheduledBlockPlace[]
}>()

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
        console.log(
          t`Schedule place ${schedule.typeId.replace('minecraft:', '')} to ${Vector.string(schedule.location, true)}, remains ${schedules.length - 1}`,
        )
        EventSignal.emit(onScheduledBlockPlace, { schedule, block, schedules })
      } catch (e) {
        if (e instanceof LocationInUnloadedChunkError) {
          yield
          continue
        }
        console.error('Unable to place schedule', e)
      }

      // Remove successfully placed block from the schedule array
      SCHEDULED_DB[dimension].splice(i, 1)
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

function getScheduleBlock(
  schedule: Readonly<ScheduledBlockPlace>,
  i: number,
  dimension: Dimensions,
  schedules: readonly ScheduledBlockPlace[],
) {
  if (typeof schedule === 'undefined') {
    SCHEDULED_DB[dimension].splice(i, 1)
    return
  }

  let date = schedule.date
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

  const block = world.overworld.getBlock(schedule.location)
  if (!block?.isValid()) {
    return
  }

  return block
}
