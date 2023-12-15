import {
  System,
  SystemAfterEvents,
  SystemBeforeEvents,
  World,
  WorldAfterEvents,
  WorldBeforeEvents,
  system,
  world,
} from '@minecraft/server'

/**
 * @typedef {{system: System;world: World;cleanup: VoidFunction;temp: Temporary;}} ProxiedSubscribers
 */

export class Temporary {
  /**
   * @template {WorldAfterEvents | WorldBeforeEvents | SystemAfterEvents | SystemBeforeEvents} Events
   * @param {Events} events
   * @returns {Events}
   * @private
   */
  proxyEvents(events) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this
    return new Proxy(events, {
      get(target, p, _) {
        // Since reciever is another object, we can't pass it there
        const value = Reflect.get(target, p, target)
        if (p === 'toJSON') return value
        if (typeof p === 'symbol') return value

        // Make sure its event signal...
        if (typeof value === 'object' && value !== null && 'subscribe' in value && 'unsubscribe' in value) {
          // Patch it
          const eventSignal = {
            /**
             * @param {(arg: object) => void} fn
             * @param  {...object} args
             */
            subscribe(fn, ...args) {
              console.log('Handled eventSignal', p)
              // @ts-expect-error We checked it above
              temp.cleaner.push(() => value.unsubscribe(fn))
              // @ts-expect-error We checked it above
              value.subscribe(fn, ...args)
            },
          }

          // Expose unsubsribe
          Reflect.setPrototypeOf(eventSignal, value)
          return eventSignal
        } else return value
      },
    })
  }
  /**
   * @private
   */
  proxySystem() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this
    return new Proxy(system, {
      get(target, p, reciever) {
        if (p === 'toJSON') return Reflect.get(target, p, reciever)
        if (typeof p === 'symbol') return Reflect.get(target, p, reciever)
        /**
         * @type {System[keyof System]}
         */
        const value = Reflect.get(target, p, reciever)

        if (typeof value === 'function') {
          /**
           * @param {object[]} args
           */
          return (...args) => {
            const handle = value.call(target, ...args)
            if (typeof handle === 'number') {
              console.log('System handled', p)
              temp.cleaner.push(() => system.clearRun(handle))
            }
            return handle
          }
        } else return value
      },
    })
  }

  /**
   * Creates new temporary system
   * @param {(arg: ProxiedSubscribers) => void} execute
   * @param {Temporary} [parent]
   */
  constructor(execute, parent) {
    if (parent) {
      execute(parent.proxied)
      return parent
    }

    /** @type {ProxiedSubscribers} */
    this.proxied = {
      world: Object.setPrototypeOf(
        {
          afterEvents: this.proxyEvents(world.afterEvents),
          beforeEvents: this.proxyEvents(world.beforeEvents),
        },
        world
      ),
      system: Object.setPrototypeOf(
        {
          afterEvents: this.proxyEvents(system.afterEvents),
          beforeEvents: this.proxyEvents(system.beforeEvents),
        },
        this.proxySystem()
      ),
      cleanup: this.cleanup,
      temp: this,
    }

    execute(this.proxied)
  }

  /**
   * Unsubscribes all temporary events
   * @type {(this: Temporary) => void}
   */
  cleanup = (() => {
    this.cleaner.forEach(fn => fn())
    this.cleaned = true
  }).bind(this)

  /**
   * List of functions that will be called on clear
   * @private
   * @type {(VoidFunction)[]}
   */
  cleaner = []

  /**
   * Weather events are unsubscribed or not
   */
  cleaned = false
}
