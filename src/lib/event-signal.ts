/**
 * The EventSignal class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template T The type of the data that the events will be emitted with.
 * @template R Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export class EventSignal<T, R = void, Callback extends (...args: any[]) => R = (arg: T) => R> {
  /**
   * Iterates through sorted subscribers of a given event signal and calls each subscriber function with the provided
   * argument, returning an array of results.
   *
   * @param signal - Event signal being emitted.
   * @param argument - Data that will be passed to the event subscribers when the event signal is emitted.
   * @returns Array of results after calling each subscriber function with the provided argument.
   */
  static emit<T extends EventSignal<any, any, any>>(signal: T, ...args: EventSignal.Argument<T>) {
    const results = []
    for (const [fn] of this.sortSubscribers(signal)) {
      results.push((fn as (...args: any[]) => unknown)(...args))
    }
    return results as EventSignal.Return<T>[]
  }

  /**
   * Sorts subscribers of a given signal based on their priority levels.
   *
   * @param signal - The `signal` parameter is a event signal that we should take callbacks from
   * @returns Array of tuples where each tuple contains the callback function and the number associated with it. The
   *   array is sorted based on the numbers in descending order.
   */
  static sortSubscribers<T extends EventSignal<any, any, any>>(signal: T) {
    return [...signal.events.entries()].sort((a, b) => b[1] - a[1]) as [EventSignal.Callback<T>, number][]
  }

  /**
   * A Map that stores the event subscribers, with the key being the callback function and the value being the position
   * of the subscriber.
   */
  private events = new Map<Callback, number>()

  /**
   * Subscribes a callback function to the events with the specified position.
   *
   * @param {Callback} callback - The callback function to subscribe to the events.
   * @param {number} position - The position of the subscriber, defaults last position
   * @returns {Callback} The callback function that has been subscribed.
   */
  subscribe(callback: Callback, position: number = this.events.size): Callback {
    this.events.set(callback, position)
    return callback
  }

  /**
   * Unsubscribes a callback function from the events.
   *
   * @param callback - The callback function to unsubscribe from the events.
   * @returns If the callback function is removed successfully it returns true, otherwise false.
   */
  unsubscribe(callback: Callback): boolean {
    return this.events.delete(callback)
  }
}

export declare namespace EventSignal {
  /** Infers the argument type of the EventSignal */
  type Argument<T extends EventSignal<any>> = Parameters<Callback<T>>

  /** Infers the return type of the EventSignal */
  type Return<T extends EventSignal<any>> = T extends EventSignal<any, infer R> ? R : unknown

  /** Infers the callback type of the EventSignal */
  type Callback<T extends EventSignal<any>> = T extends EventSignal<any, any, infer C> ? C : unknown
}

export class EventLoader extends EventSignal<undefined> {
  /**
   * Sets the loaded property of the EventLoader to true and emits all subscribed events
   *
   * @param loader - An instance of the `EventLoader` class.
   */
  static load(loader: EventLoader) {
    loader.loaded = true
    super.emit(loader, undefined)
  }

  /** Whenether event loader was loaded or not */
  loaded = false

  subscribe: EventSignal<undefined>['subscribe'] = (callback, position) => {
    if (this.loaded) callback(undefined)
    super.subscribe(callback, position)
    return callback
  }
}

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template T The type of the data that the events will be emitted with.
 * @template R Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventLoaderWithArg<T, R = void, Callback extends (arg: T) => R = (arg: T) => R> extends EventSignal<
  T,
  R,
  Callback
> {
  static load<T extends EventLoaderWithArg<any>>(signal: T, ...args: EventSignal.Argument<T>) {
    signal.loaded = true
    signal.lastArgs = args
    return super.emit(signal, ...args)
  }

  loaded = false

  private lastArgs: T[]

  constructor(...defaultArgs: T[]) {
    super()
    this.lastArgs = defaultArgs
  }

  subscribe: EventSignal<T, R, Callback>['subscribe'] = (callback, position) => {
    if (this.loaded) (callback as (...args: any[]) => unknown)(...this.lastArgs)
    super.subscribe(callback, position)
    return callback
  }
}
