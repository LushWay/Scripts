import { System, world } from '@minecraft/server'
import { util } from '../util.js'
import { OverTakes } from './OverTakes.js'

/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {}

/**
 * @param {string} type
 * @param {(fn: VoidFunction, ticks: number) => number} set
 * @param {VoidFunction} fn
 * @param {string} name
 * @param {number} ticks
 */
function Timer(type, set, fn, name, ticks = 0) {
  const visualId = `${name} (${type} ${ticks} ticks)`
  const path = util.error.stack.get(1)
  TIMERS_PATHES[visualId] = path

  return set(() => {
    const end = util.benchmark(visualId, 'timers')

    util.catch(fn, type[0].toUpperCase() + type.slice(1))

    const tookTicks = end() / 20
    if (tookTicks > ticks + 1) {
      console.warn(`§6Slow ${type} (${tookTicks.toFixed(2)}/${ticks})§r\n${path}`)
    }
  }, ticks)
}

OverTakes(System.prototype, {
  sleep(time) {
    return new Promise(resolve => super.runInterval(resolve, time))
  },
  runInterval(...args) {
    return Timer('interval', super.runInterval.bind(this), ...args)
  },
  runTimeout(...args) {
    return Timer('timeout', super.runTimeout.bind(this), ...args)
  },
  runPlayerInterval(callback, ...args) {
    return Timer(
      'playerInterval',
      super.runInterval.bind(this),
      () => {
        for (const player of world.getAllPlayers()) player && callback(player)
      },
      ...args
    )
  },
  delay(fn) {
    this.run(() => util.catch(fn, 'system.delay'))
  },
})
