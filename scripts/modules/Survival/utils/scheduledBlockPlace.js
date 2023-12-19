import { BlockPermutation, LocationInUnloadedChunkError, Vector, system, world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'smapi.js'

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
  SHEDULED_DB[dimension].push({ date: Date.now() + restoreTime, ...options })
}

system.runInterval(
  () => {
    for (const [dimension, schedules] of Object.entriesStringKeys(SHEDULED_DB)) {
      if (!Array.isArray(schedules)) continue

      for (const [i, schedule] of schedules.entries()) {
        if (!schedule) continue
        if (Date.now() < schedule.date) continue

        // To prevent blocks from restoring randomly in air
        // we calculate if there is near broken block and swap
        // their restore date, so they will restore in reversed order
        const nearBlock = schedules.find(
          e => Vector.distance(e.location, schedule.location) <= 3 && e.date > schedule.date
        )
        if (nearBlock) continue

        try {
          const block = world.overworld.getBlock(schedule.location)

          block?.setPermutation(BlockPermutation.resolve(schedule.typeId, schedule.states))
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) continue
          util.error(e)
        } finally {
          SHEDULED_DB[dimension] = schedules.filter(e => e !== schedule)
        }
      }
    }
  },
  'delayed block place',
  10
)
