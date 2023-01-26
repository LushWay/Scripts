import { XUtils } from "./XUtils.js";

/**
 * The Subscriber class is a utility class that allows subscribing and unsubscribing to events, and emitting events to all subscribers.
 * @template Data The type of the data that the events will be emitted with.
 * @template [Callback = (arg: Data) => void] The type of the callback function that will be used for the events.
 */
export class Subscriber {
	/**
	 * A private Map that stores the event subscribers, with the key being the callback function and the value being the position of the subscriber.
	 * @type {Map<Callback, number>}
	 * @private
	 */
	events = new Map();
	/**
	 * Subscribes a callback function to the events with the specified position.
	 * @param {Callback} callback The callback function to subscribe to the events.
	 * @param {number} position The position of the subscriber, defaults to 0.
	 * @returns {Callback} The callback function that has been subscribed.
	 */
	subscribe(callback, position = 0) {
		this.events.set(callback, position);
		return callback;
	}
	/**
	 * Unsubscribes a callback function from the events.
	 * @param {Callback} callback The callback function to unsubscribe from the events.
	 * @returns {boolean} If the callback function is removed successfully it returns true, otherwise false.
	 */
	unsubscribe(callback) {
		return this.events.delete(callback);
	}
	/**
	 * Emits an event to all subscribers, passing the data to the callback function.
	 * @param {Data} data The data to pass to the callback function when the event is emitted.
	 * @param {number} count The number of subscribers that will receive the event, defaults to all subscribers.
	 */
	async emit(data, count = 0) {
		const events = [...this.events.entries()].sort(([, a], [, b]) => a - b);
		const length = count > 0 && count > events.length ? count : events.length;
		for (let i = 0; i < length; i++) {
			const callback = events[i][0];
			if (typeof callback === "function") await callback(data);
		}
	}
	/**
	 * Export the subscribe and unsubscribe method
	 */
	get export() {
		return {
			subscribe: XUtils.TypedBind(this.subscribe, this),
			unsubscribe: XUtils.TypedBind(this.unsubscribe, this),
		};
	}
}
