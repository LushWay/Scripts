/**
 * The EventSignal class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template T The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventSignal<T, Return = void, Callback extends CreateCallback<T, Return> = CreateCallback<T, Return>> {
  /**
   * Iterates through sorted subscribers of a given event signal and calls each subscriber function with the provided
   * argument, returning an array of results.
   *
   * @param signal - Event signal being emitted.
   * @param argument - Data that will be passed to the event subscribers when the event signal is emitted.
   * @returns Array of results after calling each subscriber function with the provided argument.
   */
  static emit<T extends EventSignal<any>>(signal: T, ...args: EventSignal.Argument<T>[]) {
    const results = []
    for (const [fn] of this.sortSubscribers(signal)) {
      results.push((fn as CreateCallback<unknown[], unknown>)(...args))
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
  static sortSubscribers<T extends EventSignal<any>>(signal: T) {
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
  type Argument<T extends EventSignal<any>> =
    T extends EventSignal<infer A> ? (A extends unknown[] ? A[number] : A) : unknown

  /** Infers the return type of the EventSignal */
  type Return<T extends EventSignal<any>> = T extends EventSignal<any, infer R> ? R : unknown

  /** Infers the callback type of the EventSignal */
  type Callback<T extends EventSignal<any>> = T extends EventSignal<any, any, infer C> ? C : unknown
}

type CreateCallback<A, R> = A extends unknown[] ? (...args: A) => R : (arg: A) => R

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
 * @template A The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventLoaderWithArg<
  A,
  Return = void,
  Callback extends CreateCallback<A, Return> = CreateCallback<A, Return>,
> extends EventSignal<A, Return, Callback> {
  static load<T extends EventLoaderWithArg<any>>(signal: T, argument: EventSignal.Argument<T>) {
    signal.loaded = true
    signal.defaultArgument = argument
    return super.emit(signal, argument)
  }

  loaded = false

  constructor(private defaultArgument: A) {
    super()
  }

  subscribe: EventSignal<A, Return, Callback>['subscribe'] = (callback, position) => {
    if (this.loaded && typeof callback === 'function') callback(this.defaultArgument)
    super.subscribe(callback, position)
    return callback
  }
}
