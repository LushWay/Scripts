import { BlockPermutation, LocationInUnloadedChunkError, Vector, system, world } from '@minecraft/server'
import { util } from 'lib.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @typedef {{
 *   typeId: string;
 *   states?: Record<string, string | number | boolean>;
 *   date: number;
 *   location: Vector3;
 * }} ScheduledBlockPlace
 */

export const SHEDULED_DB = new DynamicPropertyDB('ScheduledBlockPlace', {
  /**
   * @type {Record<Dimensions, ScheduledBlockPlace[]>}
   */
  type: {
    end: [],
    nether: [],
    overworld: [],
  },
  defaultValue: () => [],
}).proxy()

/**
 *
 * @param {Omit<ScheduledBlockPlace, 'date'> & {
 *   dimension: Dimensions
 *   restoreTime: number
 * }} options
 */
export function scheduleBlockPlace({ dimension, restoreTime, ...options }) {
  const other = SHEDULED_DB[dimension].find(e => Vector.string(e.location) === Vector.string(options.location))
  if (!other) SHEDULED_DB[dimension].push({ date: Date.now() + restoreTime, ...options })
}

system.runInterval(
  function scheduledBlockPlaceInterval() {
    for (const schedules of Object.values(SHEDULED_DB)) {
      if (!Array.isArray(schedules)) continue

      // If we will not use immutable unproxied value,
      // proxy wrapper will convert all values into subproxies
      // which is too expensive when arrays are very big
      const immutableSchedules = DynamicPropertyDB.immutableUnproxy(schedules)

      for (const [i, schedule] of immutableSchedules.entries()) {
        if (!schedule) continue

        if (Date.now() < schedule.date) continue

        // To prevent blocks from restoring randomly in air
        // we calculate if there is near broken block and swap
        // their restore date, so they will restore in reversed order
        const nearBlock = immutableSchedules.find(
          e => e !== schedule && Vector.distance(e.location, schedule.location) <= 1 && e.date > schedule.date
        )
        if (nearBlock) continue

        try {
          const block = world.overworld.getBlock(schedule.location)
          if (!block?.isValid()) continue

          block?.setPermutation(BlockPermutation.resolve(schedule.typeId, schedule.states))
          // console.debug('schedule place', schedule.typeId, schedule.location)
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) continue
          util.error(e)
        }

        // Remove successfully placed block from the schedule array
        schedules.splice(i, 1)
      }
    }
  },
  'scheduled block place',
  10
)
