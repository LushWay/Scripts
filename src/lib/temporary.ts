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

interface ProxiedSubscribers { system: System; world: World; cleanup: VoidFunction; temp: Temporary }

export class Temporary {
  /** List of functions that will be called on clear */
  private cleaners: VoidFunction[] = []

  private proxies: ProxiedSubscribers

  /** Weather events are unsubscribed or not */
  cleaned = false

  /** Creates new temporary system */
  constructor(execute: (arg: ProxiedSubscribers) => void | { cleanup(): void }, parent?: Temporary) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let target: Temporary = this

    if (parent) {
      target = parent
    } else {
      this.proxies = {
        world: Object.setPrototypeOf(
          {
            afterEvents: this.proxyEvents(world.afterEvents),
            beforeEvents: this.proxyEvents(world.beforeEvents),
          },
          world,
        ),
        system: Object.setPrototypeOf(
          {
            afterEvents: this.proxyEvents(system.afterEvents),
            beforeEvents: this.proxyEvents(system.beforeEvents),
          },
          this.proxySystem(),
        ),
        cleanup: this.cleanup,
        temp: this,
      }
    }

    const result = execute(target.proxies)

    if (result) target.cleaners.push(result.cleanup)

    return target
  }

  private proxyEvents<Events extends WorldAfterEvents | WorldBeforeEvents | SystemAfterEvents | SystemBeforeEvents>(
    events: Events,
  ): Events {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this
    type Callback = (arg: unknown) => void
    type EventSignal = (arg: Callback, ...args: unknown[]) => void

    return new Proxy(events, {
      get(target, p, _) {
        // Since reciever is our made object, and target is native bound, we can't pass it there
        const value = Reflect.get(target, p, target)
        if (p === 'toJSON') return value
        if (typeof p === 'symbol') return value

        // Make sure its event signal...
        if (typeof value === 'object' && value !== null && 'subscribe' in value && 'unsubscribe' in value) {
          // Patch it
          const eventSignal = {
            subscribe(fn: Callback, ...args: unknown[]) {
              ;(value.subscribe as EventSignal)(fn, ...args)

              temp.cleaners.push(() => (value.unsubscribe as EventSignal)(fn))
            },
          }

          // Expose unsubsribe
          Reflect.setPrototypeOf(eventSignal, value)
          return eventSignal
        } else return value
      },
    })
  }

  private proxySystem() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const temp = this
    return new Proxy(system, {
      get(target, p, reciever) {
        if (p === 'toJSON') return Reflect.get(target, p, reciever)
        if (typeof p === 'symbol') return Reflect.get(target, p, reciever)

        const value: System[keyof System] = Reflect.get(target, p, reciever)
        if (typeof value !== 'function') return value

        return (...args: unknown[]) => {
          const handle = value.call(target, ...args)
          if (typeof handle === 'number') {
            temp.cleaners.push(() => system.clearRun(handle))
          }
          return handle
        }
      },
    })
  }

  /** Unsubscribes all temporary events */
  cleanup: (this: Temporary) => void = (() => {
    this.cleaners.forEach(fn => fn())
    this.cleaned = true
  }).bind(this)
}
