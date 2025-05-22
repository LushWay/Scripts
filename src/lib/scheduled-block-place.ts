import { Block, BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { EventSignal } from 'lib/event-signal'
import { form } from 'lib/form/new'
import { t } from 'lib/text'
import { util } from 'lib/util'
import { createLogger } from 'lib/utils/logger'
import { Vector } from 'lib/vector'

export interface ScheduledBlockPlace {
  typeId: string
  states?: Record<string, string | number | boolean>
  date: number
  location: Vector3
}

export const SCHEDULED_DB = table<ScheduledBlockPlace[]>('ScheduledBlockPlace', () => [])

export function scheduleBlockPlace({
  dimension,
  restoreTime,
  ...options
}: Omit<ScheduledBlockPlace, 'date'> & {
  dimension: DimensionType
  restoreTime: number
}): Immutable<ScheduledBlockPlace> {
  const oldSchedule = getScheduledToPlace(options.location, dimension)
  if (!oldSchedule) {
    const schedule = { date: Date.now() + restoreTime, ...options }
    SCHEDULED_DB.get(dimension).push(schedule)
    return schedule
  } else return oldSchedule
}

export function getScheduledToPlace(
  location: Vector3,
  dimension: DimensionType,
): false | undefined | Immutable<ScheduledBlockPlace> {
  const dimblocks = SCHEDULED_DB.getImmutable(dimension)
  if (typeof dimblocks === 'undefined') return false

  return dimblocks.find(e => Vector.equals(e.location, location))
}

export async function getScheduledToPlaceAsync(
  locations: Vector3[],
  dimension: DimensionType,
  yieldEach = 100,
): Promise<false | undefined | Immutable<ScheduledBlockPlace>[]> {
  const dimblocks = SCHEDULED_DB.getImmutable(dimension)
  if (typeof dimblocks === 'undefined') return false

  return new Promise((resolve, reject) => {
    const results: Immutable<ScheduledBlockPlace>[] = []
    system.runJob(
      (function* getSchedToPlaceJob() {
        try {
          for (const e of dimblocks) {
            if (locations.length === 0) break

            yield
            let i = 0
            for (const vector of locations) {
              i++
              if (i % yieldEach === 0) {
                if (yieldEach === 1000) console.log(getScheduledToPlaceAsync.name, results.length, i)
                yield
              }
              if (Vector.equals(e.location, vector)) {
                results.push(e)
                locations = locations.filter(e => e !== vector)
              }
            }
          }

          resolve(results)
        } catch (e: unknown) {
          reject(e as Error)
        }
      })(),
    )
  })
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
  schedules: Immutable<ScheduledBlockPlace>[]
}>()

export enum ScheduleDateAction {
  Remove = -1,
  PlaceImmediately = 0,
}

/**
 * Cancels scheduled block place by setting its date to -1
 *
 * @param schedule - Schedule to be canceled
 */
export function unscheduleBlockPlace(schedule: ScheduledBlockPlace) {
  schedule.date = ScheduleDateAction.Remove
}

const logger = createLogger('SheduledPlace')

const DIMENSIONS = ['overworld', 'nether', 'end'] as const

function* scheduledBlockPlaceJob() {
  for (const dimension of DIMENSIONS) {
    const schedules = SCHEDULED_DB.getImmutable(dimension) as Immutable<ScheduledBlockPlace>[]
    if (typeof schedules === 'undefined') {
      SCHEDULED_DB.delete(dimension)
      continue
    }

    const time = util.benchmark('dimension', 'sc')

    // The direction is reversed because we are mutating
    // the array that we are iterating thro
    mainLoop: for (let i = schedules.length - 1; i >= 0; i--) {
      try {
        const schedule = schedules[i]
        if (typeof schedule === 'undefined' || schedule.date === ScheduleDateAction.Remove) {
          removeScheduleAt(dimension, i)
          continue
        }

        let date = schedule.date
        if (date !== ScheduleDateAction.PlaceImmediately) {
          if (schedules.length > 500) {
            date -= ~~(schedules.length / 500)
          }
          if (Date.now() < date) {
            yield
            continue
          }

          // To prevent blocks from restoring randomly in air
          // we calculate if there is near broken block
          for (const [i, e] of schedules.entries()) {
            if (i % 100 === 0) yield
            if (e !== schedule && Vector.distance(e.location, schedule.location) <= 1 && e.date > date) {
              yield
              continue mainLoop
            }
          }
        }

        yield
        const block = world.overworld.getBlock(schedule.location)
        if (!block?.isValid) {
          if (debugLogging) logger.info`Skipping ${Vector.string(schedule.location)} because block is invalid`
          continue
        }

        block.setPermutation(BlockPermutation.resolve(schedule.typeId, schedule.states))

        if (__DEV__ || (schedules.length - 1) % 100 === 0 || debugLogging)
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
  SCHEDULED_DB.get(dimension).splice(i, 1)
}

let debugLogging = false

const scheduleForm = form(form => {
  form.title('schd')
  for (const [dim, blocks] of SCHEDULED_DB.entries()) {
    form.button(scheduledDimensionForm(dim, blocks))
  }
  form.button(t`debug: ${debugLogging}`, () => (debugLogging = !debugLogging))
})

const scheduledDimensionForm = (dim: string, blocks: ScheduledBlockPlace[]) =>
  form((form, player) => {
    const size = blocks.length
    form.title(`§7${dim}: §f${size}`)
    form.button(t`Place all blocks NOW`, () => {
      player.success(`Enjoy the CHAOS. Force-placed ${size} blocks.`)
      system.runJobForEach(blocks, e => (e.date = ScheduleDateAction.PlaceImmediately))
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
