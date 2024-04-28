const DATA_TYPE = Symbol('data_t')
const CALLBACK_TYPE = Symbol('callback_t')
const RETURN_TYPE = Symbol('return_t')

/**
 * The EventSignall class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template Data The type of the data that the events will be emitted with.
 * @template [Return=void] Return type of the subscriber. Default is `void`
 * @template [Callback=(arg: Data) => Return] The type of the callback function that will be used for the events.
 *   Default is `(arg: Data) => Return`
 */
export class EventSignal {
  /**
   * @template {EventSignal<any, any, any>} Signal
   * @param {Signal} signal
   * @returns {Pick<Signal, 'subscribe' | 'unsubscribe'>}
   */
  static bound(signal) {
    return {
      subscribe: signal.subscribe.bind(signal),
      unsubscribe: signal.unsubscribe.bind(signal),
    }
  }

  /**
   * @template {EventSignal<any, any, any>} Signal
   * @param {Signal} signal
   * @returns {[Signal[CALLBACK_TYPE], number][]}
   */
  static sortSubscribers(signal) {
    return [...signal.events.entries()].sort((a, b) => b[1] - a[1])
  }

  /**
   * @template {EventSignal<any, any, any>} Signal
   * @param {Signal} signal
   * @param {Signal[DATA_TYPE]} data
   * @returns {Signal[RETURN_TYPE][]}
   */
  static emit(signal, data) {
    const results = []
    for (const [fn] of this.sortSubscribers(signal)) results.push(fn(data))
    return results
  }

  /**
   * A private Map that stores the event subscribers, with the key being the callback function and the value being the
   * position of the subscriber.
   *
   * @private
   * @type {Map<Callback, number>}
   */
  events = new Map();

  /** @type {Data} */
  [DATA_TYPE];

  /** @type {Callback} */
  [CALLBACK_TYPE];

  /** @type {Return} */
  [RETURN_TYPE]

  /**
   * Subscribes a callback function to the events with the specified position.
   *
   * @param {Callback} callback - The callback function to subscribe to the events.
   * @param {number} position - The position of the subscriber, defaults last position
   * @returns {Callback} The callback function that has been subscribed.
   */
  subscribe(callback, position = this.events.size) {
    this.events.set(callback, position)
    return callback
  }

  /**
   * Unsubscribes a callback function from the events.
   *
   * @param {Callback} callback - The callback function to unsubscribe from the events.
   * @returns {boolean} If the callback function is removed successfully it returns true, otherwise false.
   */
  unsubscribe(callback) {
    return this.events.delete(callback)
  }
}

/** @extends {EventSignal<undefined>} */
export class EventLoader extends EventSignal {
  /** @param {EventLoader} loader */
  static load(loader) {
    loader.loaded = true
    return super.emit(loader, undefined)
  }

  loaded = false

  /** @type {EventSignal<undefined>['subscribe']} */
  subscribe(callback, position) {
    if (this.loaded) callback(undefined)
    else super.subscribe(callback, position)
    return callback
  }
}

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to
 * all subscribers.
 *
 * @template [Data={}] The type of the data that the events will be emitted with. Default is `{}`
 * @template [Return=void] Return type of the subscriber. Default is `void`
 * @template [Callback=(arg: Data) => Return] The type of the callback function that will be used for the events.
 *   Default is `(arg: Data) => Return`
 * @extends {EventSignal<Data, Return, Callback>}
 */
export class EventLoaderWithArg extends EventSignal {
  /**
   * @template {EventLoaderWithArg<any, any, any>} Signal
   * @param {Signal} signal
   * @param {Signal[DATA_TYPE]} data
   * @returns {Signal[RETURN_TYPE][]}
   */
  static load(signal, data) {
    signal.loaded = true
    return super.emit(signal, data)
  }

  loaded = false

  /** @param {Data} [defaultValue] */
  constructor(defaultValue) {
    super()

    /** @private */
    this.defaultValue = defaultValue
  }

  /** @type {EventSignal<Data, Return, Callback>['subscribe']} */
  subscribe(callback, position) {
    if (this.loaded && typeof callback === 'function') callback(this.defaultValue)
    else super.subscribe(callback, position)
    return callback
  }
}
