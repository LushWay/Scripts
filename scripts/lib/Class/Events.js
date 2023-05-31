const DATA_TYPE = Symbol("data_t");
const RETURN_TYPE = Symbol("return_t");

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to all subscribers.
 * @template Data The type of the data that the events will be emitted with.
 * @template [Return=void] Return type of the subscriber
 * @template [Callback = (arg: Data) => Return] The type of the callback function that will be used for the events.
 */
export class EventSignal {
	/**
	 *
	 * @template {EventSignal<any>} Signal
	 * @param {Signal} signal
	 * @param {Signal[DATA_TYPE]} data
	 * @returns {Array<Signal[RETURN_TYPE]>}
	 */
	static emit(signal, data) {
		const results = [];
		for (const [fn] of [...signal.events.entries()].sort((a, b) => a[1] - b[1]))
			results.push(fn(data));

		return results;
	}

	/**
	 * A private Map that stores the event subscribers, with the key being the callback function and the value being the position of the subscriber.
	 * @type {Map<Callback, number>}
	 * @private
	 */
	events = new Map();

	/** @type {Data} */
	[DATA_TYPE];

	/** @type {Return} */
	[RETURN_TYPE];

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
}
