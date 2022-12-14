import { Player } from "@minecraft/server";
import { Database } from "../Database/Entity.js";

export const AllPlayerOptions = {};

export const AllOptions = {};

/** @type {import("./XOptions.js").XPlayerOptions} */
export function XPlayerOptions(prefix, CONFIG) {
	if (!(prefix in AllPlayerOptions)) AllPlayerOptions[prefix] = CONFIG;
	// @ts-expect-error Trust me, TS
	return (player) => generateOptionsProxy(prefix, CONFIG, player);
}

/** @type {import("./XOptions.js").XOptions} */
export function XOptions(prefix, CONFIG) {
	if (!(prefix in AllOptions)) AllOptions[prefix] = CONFIG;
	// @ts-expect-error Trust me, TS
	return generateOptionsProxy(prefix, CONFIG);
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {string} prefix - The prefix for the database.
 * @param {object} CONFIG - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
 * @param {Player} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
function generateOptionsProxy(prefix, CONFIG, player = null) {
	/** @type {Database<string, string | boolean | number>} */
	const DB = new Database(prefix);
	const OptionsProxy = {};
	for (const prop in CONFIG) {
		const key = player ? player.id + ":" + prop : prop;
		Object.defineProperty(OptionsProxy, prop, {
			configurable: false,
			enumerable: true,
			get() {
				return DB.get(key) ?? CONFIG[prop];
			},
			set(v) {
				DB.set(key, v);
			},
		});
	}
	return OptionsProxy;
}
