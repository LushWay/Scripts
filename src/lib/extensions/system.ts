import { System, world } from '@minecraft/server'
import { util } from '../util'
import { expand } from './extend'

declare module '@minecraft/server' {
  interface System {
    /**
     * Runs a set of code on an interval for each player.
     *
     * @param callback Functional code that will run when this interval occurs.
     * @param tickInterval An interval of every N ticks that the callback will be called upon.
     * @returns An opaque handle that can be used with the clearRun method to stop the run of this function on an
     *   interval.
     */
    runPlayerInterval(callback: (player: Player) => void, name: string, tickInterval?: number): number

    /** Same as {@link System.run} except for auto handling errors */
    delay(callback: () => void): void

    /**
     * Returns a promise that resolves after given ticks time
     *
     * @param time Time in ticks
     * @returns Promise that resolves after given ticks time
     */
    sleep(time: number): Promise<void>
  }
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

export const TIMERS_PATHES: Record<string, string> = {}

function Timer(
  type: string,
  set: (fn: VoidFunction, ticks: number) => number,
  fn: VoidFunction,
  name: string,
  ticks = 0,
) {
  const visualId = `${name} (${type} ${ticks} ticks)`

  const path = util.error.stack.get(1)

  TIMERS_PATHES[visualId] = path

  return set(function timer() {
    let end
    __DEV__ && (end = util.benchmark(visualId, 'timers'))

    util.catch(fn, type[0].toUpperCase() + type.slice(1))

    if (__DEV__) {
      const tookTicks = (end?.() ?? 1) / 20
      if (tookTicks > ticks + 1) {
        console.warn(`§6Spike on ${type} §f${name}:§6 took §c${tookTicks.toFixed(2)}§f/${ticks}§6 ticks§r\n${path}`)
      }
    }
  }, ticks)
}
