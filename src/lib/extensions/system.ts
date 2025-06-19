import { system, System, world } from '@minecraft/server'
import stringifyError from 'lib/utils/error'
import { capitalize, util } from '../util'
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

    /**
     * @remarks
     *   Queues a generator to run until completion. The generator will be given a time slice each tick, and will be run
     *   until it yields or completes.
     * @returns An opaque handle that can be used with {@link System.clearJob} to stop the run of this generator.
     * @beta
     */
    runJobForEach<T>(array: T[], callback: (element: T, i: number, array: T[]) => void): Promise<void>

    /**
     * Runs a set of code on an interval inside of runJob each tickInterval ticks
     *
     * @param callback Code to run
     * @param tickInterval Time in ticks between each run. Its not guaranted that it will be consistent
     */
    runJobInterval(callback: () => Generator, tickInterval: number): () => void

    runJob(generator: Generator<void, void, void>, name?: string): number
  }
}

expand(System.prototype, {
  sleep(time) {
    return new Promise(resolve => super.runInterval(resolve, time))
  },

  runInterval(...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Timer('interval', super.runInterval.bind(this), ...args)
  },

  runTimeout(...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Timer('timeout', super.runTimeout.bind(this), ...args)
  },

  runJob(generator, name) {
    const id = name ?? stringifyError.parent()
    return super.runJob(
      (function* runJobWrapper() {
        let v
        do {
          const end = util.benchmark(id, 'job')
          v = generator.next()
          end()
          yield
        } while (!v.done)
      })(),
    )
  },

  runPlayerInterval(callback, ...args) {
    return Timer(
      'playerInterval',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super.runInterval.bind(this),
      function playersInterval() {
        for (const player of world.getAllPlayers()) {
          if (player.isValid) callback(player)
        }
      },

      ...args,
    )
  },

  delay(fn) {
    const origin = stringifyError.stack.get(1)
    this.run(function delay() {
      util.catch(fn, 'system.delay', origin)
    })
  },

  runJobInterval(callback, tickInterval) {
    let stopped = false

    function jobInterval() {
      system.runJob(
        (function* job() {
          for (const _ of callback()) yield
          if (stopped) return
          if (tickInterval === 0) system.delay(jobInterval)
          else system.runTimeout(jobInterval, 'jobInterval', tickInterval)
        })(),
      )
    }

    system.delay(jobInterval)
    return () => {
      stopped = true
    }
  },

  runJobForEach(array, callback) {
    return new Promise((resolve, reject) => {
      this.runJob(
        (function* generator() {
          try {
            for (const [i, element] of array.entries()) {
              callback(element, i, array)
              yield
            }
            resolve()
          } catch (error: unknown) {
            reject(error as Error)
          }
        })(),
      )
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
  const path = stringifyError.stack.get(__DEV__ ? 2 : 1)
  TIMERS_PATHES[visualId] = path

  function timer() {
    util.catch(fn, capitalize(type))
  }

  return __DEV__
    ? set(function devTimerWithBench() {
        const end = util.benchmark(visualId, 'timers')

        timer()

        const tookTicks = end() / 20
        if (tookTicks > ticks + 1) {
          console.warn(`§6Spike on ${type} §f${name}:§6 took §c${tookTicks.toFixed(2)}§f/${ticks}§6 ticks§r\n${path}`)
        }
      }, ticks)
    : set(timer, ticks)
}
