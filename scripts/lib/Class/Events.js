import { world } from "@minecraft/server";
import { handler, ThrowError, toStr } from "xapi.js";

/**
 * @template C, B
 * @param {C extends Function ? C : never} callback
 * @param {B} _this
 * @returns {C}
 */
function BINDER(callback, _this) {
	return callback.bind(_this);
}

/**
 * @template Data, [Callback = (arg: Data) => void]
 */
export class Subscriber {
	/**
	 * @private
	 * @type {Map<Callback, number>}
	 */
	events = new Map();
	/**
	 *
	 * @param {Callback} callback
	 * @param {number} position
	 */
	subscribe(callback, position = 0) {
		this.events.set(callback, position);
		return callback;
	}
	/**
	 *
	 * @param {Callback} callback
	 * @returns
	 */
	unsubscribe(callback) {
		return this.events.delete(callback);
	}
	/**
	 *
	 * @param {Data} data
	 * @param {number} count
	 */
	async emit(data, count = 0) {
		const events = [...this.events.entries()].sort(([_c0, a], [_c1, b]) => a - b);
		const length = count > 0 && count > events.length ? count : events.length;
		for (let i = 0; i < length; i++) {
			const callback = events[i][0];
			if (typeof callback === "function") await callback(data);
		}
	}
	get export() {
		return {
			subscribe: BINDER(this.subscribe, this),
			unsubscribe: BINDER(this.unsubscribe, this),
		};
	}
}
