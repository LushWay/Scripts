/** @typedef {(data: any, name: string) => void} IEventCallback */

/** @type {{ name: string; callback: IEventCallback }[]} */
const EVENTS = [];

export const XEvents = {
	/**
	 *
	 * @param {string} name
	 * @param {IEventCallback} callbak
	 */
	addEventListener(name, callbak) {
		EVENTS.push({ name: name, callback: callbak });
	},
	/**
	 *
	 * @param {string} name
	 * @param {any} extras
	 * @param {boolean} debug
	 */
	emit(name, extras = null, debug = false) {
		const event = EVENTS.find((e) => e.name === name);
		if (debug) console.warn(name);
		if (event && typeof event.callback === "function") event.callback(extras, name);
	},
};
