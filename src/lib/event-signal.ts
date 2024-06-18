/**
 * The EventSignal class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template Argument The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventSignal<Argument, Return = void, Callback = (arg: Argument) => Return> {
  /**
   * Takes an event signal and returns only the "subscribe" and "unsubscribe" methods bound to the signal.
   *
   * Usefull for hiding ability to emit events from outsource
   *
   * ```js
   * // lib.ts
   * const someEvent = new EventSignal()
   *
   * const afterEvents = {
   *   someEvent: EventSignal.bound(someEvent)
   * }
   *
   * EventSignal.emit(someEvent) // insource emitting works!
   *
   * // reciever.ts
   * afterEvents.someEvent.subscribe(() => {}) // Only subscribe/unsubscribe methods are exported!
   *
   * EventSignal.emit(afterEvents.someEvent) // TypeError, no way to emit events from outsource
   *
   * ```
   *
   * @param {Signal} signal - The `signal` parameter is expected to be an object that implements the `EventSignal`
   *   interface with three type parameters.
   * @returns Object with two properties: `subscribe` and `unsubscribe`.
   */
  static bound<Signal extends EventSignal<unknown, unknown, unknown>>(signal: Signal) {
    return {
      subscribe: signal.subscribe.bind(signal) as Signal['subscribe'],
      unsubscribe: signal.unsubscribe.bind(signal) as Signal['unsubscribe'],
    }
  }

  /**
   * Sorts subscribers of a given signal based on their priority levels.
   *
   * @param signal - The `signal` parameter is a event signal that we should take callbacks from
   * @returns Array of tuples where each tuple contains the callback function and the number associated with it. The
   *   array is sorted based on the numbers in descending order.
   */
  static sortSubscribers<T extends EventSignal.Any>(signal: T) {
    return [...signal.events.entries()].sort((a, b) => b[1] - a[1]) as [EventSignal.Callback<T>, number][]
  }

  /**
   * Iterates through sorted subscribers of a given event signal and calls each subscriber function with the provided
   * argument, returning an array of results.
   *
   * @param signal - Event signal being emitted.
   * @param argument - Data that will be passed to the event subscribers when the event signal is emitted.
   * @returns Array of results after calling each subscriber function with the provided argument.
   */
  static emit<T extends EventSignal.Any>(signal: T, argument: EventSignal.Argument<T>) {
    const results = []
    for (const [fn] of this.sortSubscribers(signal)) results.push(fn(argument))
    return results as EventSignal.Return<T>[]
  }

  /**
   * A private Map that stores the event subscribers, with the key being the callback function and the value being the
   * position of the subscriber.
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
  type Any = EventSignal<unknown, unknown, (...arg: unknown[]) => unknown>
  type Argument<T extends Any> = T extends EventSignal<infer A, unknown, unknown> ? A : unknown
  type Return<T extends Any> = T extends EventSignal<unknown, infer A, unknown> ? A : unknown
  type Callback<T extends Any> = T extends EventSignal<unknown, unknown, infer A> ? A : unknown
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
 * @template Argument The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventLoaderWithArg<Argument, Return = void, Callback = (arg: Argument) => Return> extends EventSignal<
  Argument,
  Return,
  Callback
> {
  static load<T extends EventLoaderWithArg<unknown>>(signal: T, argument: EventSignal.Argument<T>) {
    signal.loaded = true
    signal.defaultArgument = argument
    return super.emit(signal, argument)
  }

  loaded = false

  constructor(private defaultArgument: Argument) {
    super()
  }

  subscribe: EventSignal<Argument, Return, Callback>['subscribe'] = (callback, position) => {
    if (this.loaded && typeof callback === 'function') callback(this.defaultArgument)
    super.subscribe(callback, position)
    return callback
  }
}
