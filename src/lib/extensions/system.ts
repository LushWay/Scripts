import { System, world } from '@minecraft/server'
import { util } from '../util'
import { expand } from './extend'

export const TIMERS_PATHES: Record<string, string> = {}

function Timer(
  type: string,
  set: (fn: VoidFunction, ticks: number) => number,
  fn: VoidFunction,
  name: string,
  ticks: number = 0,
) {
  const visualId = `${name} (${type} ${ticks} ticks)`

  const path = util.error.stack.get(1)

  TIMERS_PATHES[visualId] = path

  return set(function timer() {
    const end = util.benchmark(visualId, 'timers')

    util.catch(fn, type[0].toUpperCase() + type.slice(1))

    const tookTicks = end() / 20
    if (tookTicks > ticks + 1) {
      console.warn(`§6Spike on ${type} §f${name}:§6 took §c${tookTicks.toFixed(2)}§f/${ticks}§6 ticks§r\n${path}`)
    }
  }, ticks)
}

expand(System.prototype, {
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
      function playersInterval() {
        for (const player of world.getAllPlayers()) player && callback(player)
      },

      ...args,
    )
  },
  delay(fn) {
    this.run(function delay() {
      util.catch(fn, 'system.delay')
    })
  },
})
