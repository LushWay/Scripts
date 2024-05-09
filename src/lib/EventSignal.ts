const DATA_TYPE = Symbol('data_t')
const CALLBACK_TYPE = Symbol('callback_t')
const RETURN_TYPE = Symbol('return_t')

/**
 * The EventSignall class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template Data The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventSignal<Data, Return = void, Callback = (arg: Data) => Return> {
  static bound<Signal extends EventSignal<unknown, unknown, unknown>>(
    signal: Signal,
  ): Pick<Signal, 'subscribe' | 'unsubscribe'> {
    return {
      subscribe: signal.subscribe.bind(signal),
      unsubscribe: signal.unsubscribe.bind(signal),
    }
  }

  static sortSubscribers<Signal extends EventSignal<unknown, unknown, unknown>>(
    signal: Signal,
  ): [Signal[typeof CALLBACK_TYPE], number][] {
    return [...signal.events.entries()].sort((a, b) => b[1] - a[1])
  }

  static emit<Signal extends EventSignal<unknown>>(
    signal: Signal,
    data: Signal[typeof DATA_TYPE],
  ): Signal[typeof RETURN_TYPE][] {
    const results = []
    for (const [fn] of this.sortSubscribers(signal)) results.push(fn(data))
    return results
  }

  /**
   * A private Map that stores the event subscribers, with the key being the callback function and the value being the
   * position of the subscriber.
   */
  private events: Map<Callback, number> = new Map();

  [DATA_TYPE]: Data;

  [CALLBACK_TYPE]: Callback;

  [RETURN_TYPE]: Return

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

export class EventLoader extends EventSignal<undefined> {
  static load(loader: EventLoader) {
    loader.loaded = true
    return super.emit(loader, undefined)
  }

  loaded = false

  subscribe: EventSignal<undefined>['subscribe'] = (callback, position) => {
    if (this.loaded) callback(undefined)
    else super.subscribe(callback, position)
    return callback
  }
}

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template Data The type of the data that the events will be emitted with.
 * @template Return Return type of the subscriber. Default is `void`
 * @template Callback The type of the callback function that will be used for the events.
 */
export class EventLoaderWithArg<Data, Return = void, Callback = (arg: Data) => Return> extends EventSignal<
  Data,
  Return,
  Callback
> {
  static load<Signal extends EventLoaderWithArg<unknown>>(
    signal: Signal,
    data: Signal[typeof DATA_TYPE],
  ): Signal[typeof RETURN_TYPE][] {
    signal.loaded = true
    return super.emit(signal, data)
  }

  loaded = false

  constructor(private defaultValue: Data) {
    super()
  }

  subscribe: EventSignal<Data, Return, Callback>['subscribe'] = (callback, position) => {
    if (this.loaded && typeof callback === 'function') callback(this.defaultValue)
    else super.subscribe(callback, position)
    return callback
  }
}
