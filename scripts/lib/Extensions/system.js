import { System, world } from '@minecraft/server'
import { util } from '../util.js'
import { OverTakes } from './import.js'

/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {}

OverTakes(System.prototype, {
  sleep(time) {
    return new Promise(resolve => super.runInterval(resolve, time))
  },
  runInterval(fn, name, ticks = 0) {
    const visualId = `${name} (loop ${ticks} ticks)`
    const path = util.error.stack.get()
    TIMERS_PATHES[visualId] = path

    return super.runInterval(() => {
      const end = util.benchmark(visualId, 'timers')

      util.catch(fn, 'Interval')

      const tookTicks = ~~(end() / 20)
      if (tookTicks > ticks)
        console.warn(
          `Found slow interval (${tookTicks}/${ticks})  at:\n${path}`
        )
    }, ticks)
  },
  runTimeout(fn, name, ticks = 0) {
    const visualId = `${name} (loop ${ticks} ticks)`
    const path = util.error.stack.get()
    TIMERS_PATHES[visualId] = path

    return super.runTimeout(() => {
      const end = util.benchmark(visualId, 'timers')

      util.catch(fn, 'Timeout')

      const tookTicks = ~~(end() / 20)
      if (tookTicks > ticks)
        console.warn(`Found slow timeout (${tookTicks}/${ticks}) at:\n${path}`)
    }, ticks)
  },
  runPlayerInterval(fn, name, ticks = 0) {
    const visualId = `${name} (loop ${ticks} ticks)`
    const path = util.error.stack.get()
    TIMERS_PATHES[visualId] = path
    const forEach = () => {
      for (const player of world.getPlayers()) fn(player)
    }

    return super.runInterval(() => {
      const end = util.benchmark(visualId, 'timers')

      util.catch(forEach, 'Player interval')

      const tookTicks = ~~(end() / 20)
      if (tookTicks > ticks)
        console.warn(`Found slow players interval at:\n${path}`)
    }, ticks)
  },
})
