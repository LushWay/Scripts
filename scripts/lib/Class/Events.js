const DATA_TYPE = Symbol("data");
const RETURN_TYPE = Symbol("return");
const EMIT = Symbol("emit");

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to all subscribers.
 * @template Data The type of the data that the events will be emitted with.
 * @template [Return=void] Return type of the subscriber
 * @template [Callback = (arg: Data) => Return] The type of the callback function that will be used for the events.
 */
export class EventSignal {
	/** @type {Data} */
	[DATA_TYPE];

	/** @type {Return} */
	[RETURN_TYPE];
	/**
	 *
	 * @template {EventSignal<any>} Signal
	 * @param {Signal} signal
	 * @param {Signal[DATA_TYPE]} data
	 */
	static emit(signal, data) {
		const results = [];
		for (const [fn] of signal.events) results.push(fn(data));
		return results;
	}
	/**
	 * A private Map that stores the event subscribers, with the key being the callback function and the value being the position of the subscriber.
	 * @type {Map<Callback, number>}
	 * @private
	 */
	events = new Map();
	/**
	 * Subscribes a callback function to the events with the specified position.
	 * @param {Callback} callback - The callback function to subscribe to the events.
	 * @param {number} position - The position of the subscriber, defaults last position
	 * @returns {Callback} The callback function that has been subscribed.
	 */
	subscribe(callback, position = this.events.size) {
		this.events.set(callback, position);
		return callback;
	}
	/**
	 * Unsubscribes a callback function from the events.
	 * @param {Callback} callback - The callback function to unsubscribe from the events.
	 * @returns {boolean} If the callback function is removed successfully it returns true, otherwise false.
	 */
	unsubscribe(callback) {
		return this.events.delete(callback);
	}
	/**
	 * Emits an event to all subscribers, passing the data to the callback function.
	 * @param {Data} data - The data to pass to the callback function when the event is emitted.
	 * @param {number} count - The number of subscribers that will receive the event, defaults to all subscribers.
	 * @returns {Return[]}
	 */
	emit(data, count = 0) {
		const events = [...this.events.entries()].sort(([, a], [, b]) => a - b);
		const length = count > 0 && count > events.length ? count : events.length;
		const results = [];
		for (let i = 0; i < length; i++) {
			const callback = events[i][0];
			if (typeof callback === "function") results.push(callback(data));
		}
		return results;
	}
}
