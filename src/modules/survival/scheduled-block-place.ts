import { BlockPermutation, LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { Vector, util } from 'lib'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { t } from 'lib/text'

interface ScheduledBlockPlace {
  typeId: string
  states?: Record<string, string | number | boolean>
  date: number
  location: Vector3
}

export const SHEDULED_DB = table<ScheduledBlockPlace[]>('ScheduledBlockPlace', () => []) as Record<
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
  const other = IMMUTABLE_DB[dimension].find(e => Vector.equals(e.location, options.location))

  if (!other) SHEDULED_DB[dimension].push({ date: Date.now() + restoreTime, ...options })
}

// If we will not use immutable unproxied value,
// proxy wrapper will convert all values into subproxies
// which is too expensive when arrays are very big
const IMMUTABLE_DB = ProxyDatabase.immutableUnproxy(SHEDULED_DB)

/** @type {['overworld', 'nether', 'end']} */
const DIMENSIONS: ['overworld', 'nether', 'end'] = ['overworld', 'nether', 'end']

function timeout() {
  system.runTimeout(
    () => {
      function* scheduledBlockPlaceJob() {
        for (const dimension of DIMENSIONS) {
          const schedules = IMMUTABLE_DB[dimension]
          if (typeof schedules === 'undefined') {
            Reflect.deleteProperty(SHEDULED_DB, dimension)
            continue
          }

          const time = util.benchmark('dimension', 'sc')

          // The direction is reversed because we are mutating
          // the array that we are iterating thro
          for (let i = schedules.length - 1; i >= 0; i--) {
            const schedule = schedules[i]
            if (typeof schedule === 'undefined') {
              SHEDULED_DB[dimension].splice(i, 1)
              yield
              continue
            }

            let date = schedule.date
            if (schedules.length > 500) {
              date -= ~~(schedules.length / 500)
            }
            if (Date.now() < date) {
              yield
              continue
            }

            // To prevent blocks from restoring randomly in air
            // we calculate if there is near broken block
            const nearAir = schedules.find(
              e => e !== schedule && Vector.distance(e.location, schedule.location) <= 1 && e.date > date,
            )
            if (nearAir) {
              yield
              continue
            }

            try {
              const block = world.overworld.getBlock(schedule.location)
              if (!block?.isValid()) {
                yield
                continue
              }

              block.setPermutation(BlockPermutation.resolve(schedule.typeId, schedule.states))
              console.log(
                t`Schedule place ${schedule.typeId.replace('minecraft:', '')} to ${Vector.string(schedule.location, true)}, remains ${schedules.length}`,
              )
            } catch (e) {
              if (e instanceof LocationInUnloadedChunkError) {
                yield
                continue
              }
              console.error(e)
            }

            // Remove successfully placed block from the schedule array
            SHEDULED_DB[dimension].splice(i, 1)
            yield
          }

          time()
          timeout()
        }
      }

      system.runJob(scheduledBlockPlaceJob())
    },
    'scheduled block place',
    10,
  )
}

timeout()
