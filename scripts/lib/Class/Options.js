import { Player } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";
import { util } from "../Setup/util.js";

export const OPTIONS_NAME = Symbol("name");

/**
 * @typedef {string | boolean | number | JSONLike} Option
 */

/**
 * @typedef {Record<string, { desc: string; value: T, name: string }> & {[OPTIONS_NAME]?: string}} DefaultConfig
 * @template [T = boolean | string | number]
 */

/**
 * TS doesn't converting true and false to boolean
 * @typedef {T extends true | false ? boolean : T} Normalize
 * @template T
 */

/** @typedef {Database<string, Record<string, Option>>} OPTIONS_DB */
/** @type {OPTIONS_DB} */
const PLAYER_DB = Database.eventProxy(new Database("player"), {
	beforeGet: (key, value) => value ?? {},
	beforeSet: (key, value) => value,
});

/**
 * @typedef {DefaultConfig<Option> & Record<string, { requires?: boolean }>} WorldOptionsConfig */
/** @type {OPTIONS_DB} */
const WORLD_OPTIONS = new Database("options", {
	beforeGet: (key, value) => value ?? {},
	beforeSet: (key, value) => value,
});

export class Options {
	/** @type {Record<string, DefaultConfig<boolean>>} */
	static PLAYER = {};
	/**
	 * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
	 * stored in a database
	 * @template {DefaultConfig<boolean>} Config
	 * @param {string} name - The name that shows to players
	 * @param {string} prefix - The prefix for the database.
	 * @param {Config} CONFIG - This is an object that contains the default values for each option.
	 * @returns {(player: Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
	 */
	static player(name, prefix, CONFIG) {
		CONFIG[OPTIONS_NAME] = name;

		if (!(prefix in this.PLAYER)) {
			this.PLAYER[prefix] = CONFIG;
		} else {
			this.PLAYER[prefix] = {
				...this.PLAYER[prefix],
				...CONFIG,
			};
		}
		return (player) =>
			// @ts-expect-error Trust me, TS
			generateOptionsProxy(PLAYER_DB, prefix, this.PLAYER[prefix], player);
	}

	/** @type {Record<string, WorldOptionsConfig>} */
	static WORLD = {};

	/**
	 * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
	 * configuration object's properties in localStorage
	 * @template {WorldOptionsConfig} Config
	 * @param {string} prefix - The prefix for the database.
	 * @param {Config} CONFIG - The default values for the options.
	 * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
	 */
	static world(prefix, CONFIG) {
		if (!(prefix in this.WORLD)) {
			this.WORLD[prefix] = CONFIG;
		} else {
			this.WORLD[prefix] = {
				...this.WORLD[prefix],
				...CONFIG,
			};
		}
		// @ts-expect-error Trust me, TS
		return generateOptionsProxy(WORLD_OPTIONS, prefix, this.WORLD[prefix]);
	}
}

/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {OPTIONS_DB} database - The prefix for the database.
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
				return database.get(prefix)?.[key] ?? CONFIG[prop].value;
			},
			set(v) {
				const value = database.get(prefix) ?? {};
				value[key] = v;
				database.set(prefix, value);
			},
		});
	}
	return OptionsProxy;
}

export class EditableLocation {
	static OPTION_KEY = "locations";
	valid = true;
	x = 0;
	y = 0;
	z = 0;
	/**
	 *
	 * @param {string} id
	 * @param {Object} [options]
	 * @param {boolean | Vector3} [options.fallback]
	 */
	constructor(id, { fallback = false } = {}) {
		this.id = id;
		let location = WORLD_OPTIONS.get(EditableLocation.OPTION_KEY)[id];
		Options.WORLD[EditableLocation.OPTION_KEY][id] = {
			desc: `Позиция ${id}`,
			name: id,
			value: fallback ? fallback : {},
		};

		if (
			!location ||
			(typeof location === "object" && Object.keys(location).length === 0)
		) {
			if (!fallback) {
				console.warn(
					"§eSetup location §f" + id + "§e in\n" + util.error.stack.get()
				);
				this.valid = false;
				return;
			} else location = fallback;
		}
		if (
			typeof location !== "object" ||
			!["x", "y", "z"].every((pos) => Object.keys(location).includes(pos))
		) {
			util.error(new TypeError("Invalid location"));
			console.error(util.inspect(location));
			this.valid = false;
			return;
		}

		this.x = location.x;
		this.y = location.y;
		this.z = location.z;
	}
}

Options.WORLD[EditableLocation.OPTION_KEY] = {};
