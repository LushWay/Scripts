import { Player } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";

/**
 * @typedef {Record<string, { desc: string; value: T }>} DefaultConfig
 * @template [T = boolean | string | number]
 */

/** @typedef {Database<string, Record<string, string | boolean | number>>} DB */

/**
 * TS doesn't converting true and false to boolean
 * @typedef {T extends true | false ? boolean : T} Normalize
 * @template T
 */

/** @type {Record<string, DefaultConfig<boolean>>} */
export const PLAYER_OPTIONS = {};

/** @type {DB} */
const PLAYER_DB = new Database("player");

/**
 * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
 * stored in a database
 * @template {DefaultConfig<boolean>} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - This is an object that contains the default values for each option.
 * @returns {(player: Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XPlayerOptions(prefix, CONFIG) {
	if (!(prefix in PLAYER_OPTIONS)) {
		PLAYER_OPTIONS[prefix] = CONFIG;
	} else {
		PLAYER_OPTIONS[prefix] = {
			...PLAYER_OPTIONS[prefix],
			...CONFIG,
		};
	}
	// @ts-expect-error Trust me, TS
	return (player) => generateOptionsProxy(PLAYER_DB, CONFIG, player);
}

/** @type {Record<string, DefaultConfig>} */
export const OPTIONS = {};

/** @type {DB} */
const DB = new Database("options");

/**
 * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
 * configuration object's properties in localStorage
 * @template {DefaultConfig} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - The default values for the options.
 * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XOptions(prefix, CONFIG) {
	if (!(prefix in OPTIONS)) {
		OPTIONS[prefix] = CONFIG;
	} else {
		OPTIONS[prefix] = {
			...OPTIONS[prefix],
			...CONFIG,
		};
	}
	// @ts-expect-error Trust me, TS
	return generateOptionsProxy(DB, CONFIG);
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {DB} database - The prefix for the database.
 * @param {string} prefix - The prefix for the database.
 * @param {DefaultConfig} CONFIG - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
 * @param {Player} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
function generateOptionsProxy(database, prefix, CONFIG, player = null) {
	const OptionsProxy = {};
	for (const prop in CONFIG) {
		const key = player ? player.id + ":" + prop : prop;
		Object.defineProperty(OptionsProxy, prop, {
			configurable: false,
			enumerable: true,
			get() {
				const value = DB.get(prefix) ?? {};
				return value[key] ?? CONFIG[prop].value;
			},
			set(v) {
				const value = DB.get(prefix) ?? {};
				value[key] = v;
				DB.set(prefix, value);
			},
		});
	}
	return OptionsProxy;
}
