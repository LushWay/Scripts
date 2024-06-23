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

interface ProxiedSubscribers {
  system: System
  world: World
  cleanup: VoidFunction
  temporary: Temporary
}

export class Temporary {
  /** List of functions that will be called on clear */
  protected cleaners: VoidFunction[] = []

  // @ts-expect-error Assignment is done.
  protected proxies: ProxiedSubscribers

  /** Weather events are unsubscribed or not */
  cleaned = false

  /** Creates new temporary system */
  constructor(execute: (arg: ProxiedSubscribers) => void | { cleanup(this: void): void }, parent?: Temporary) {
    const target = parent ? parent : this
    if (target === this) {
      this.proxies = {
        world: Object.setPrototypeOf(
          {
            afterEvents: this.proxyEvents(world.afterEvents),
            beforeEvents: this.proxyEvents(world.beforeEvents),
          },
          world,
        ) as World,
        system: Object.setPrototypeOf(
          {
            afterEvents: this.proxyEvents(system.afterEvents),
            beforeEvents: this.proxyEvents(system.beforeEvents),
          },
          this.proxySystem(),
        ) as System,
        cleanup: this.cleanup,
        temporary: this,
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
    return new Proxy(system, {
      get: (target, p, reciever) => {
        if (p === 'toJSON') return Reflect.get(target, p, reciever) as unknown
        if (typeof p === 'symbol') return Reflect.get(target, p, reciever) as unknown

        const value = Reflect.get(target, p, reciever) as System[keyof System]
        if (typeof value !== 'function') return value

        return (...args: unknown[]) => {
          const handle = value.call(
            target,
            // @ts-expect-error Huuuuh idk
            ...args,
          )
          if (typeof handle === 'number') this.cleaners.push(() => system.clearRun(handle))

          return handle
        }
      },
    })
  }

  /** Unsubscribes all temporary events */
  readonly cleanup = (() => {
    this.cleaners.forEach(fn => fn())
    this.cleaned = true
  }) as (this: void) => void
}
