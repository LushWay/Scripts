import { Player, world, World } from "@minecraft/server";
import { ThrowError } from "xapi.js";

/**
 * @template S
 */
export class XInstantDatabase {
	#source;
	#key;
	/**
	 * @param {S} source
	 * @param {import("./types.js").DBkey<S>} name
	 */
	constructor(source, name) {
		this.#source = source;
		this.#key = name;
	}
	get data() {
		return GetData(this.#source, this.#key);
	}
	/**
	 *
	 * @param {string} key
	 * @returns {import("./types.js").DBvalue}
	 */
	get(key) {
		return this.data[key];
	}
	/**
	 *
	 * @param {string} key
	 * @param {import("./types.js").DBvalue} value
	 * @returns {void}
	 */
	set(key, value) {
		const data = this.data;
		data[key] = value;
		SafeData(this.#source, this.#key, data);
	}
	values() {
		return Object.values(this.data);
	}
	keys() {
		return Object.keys(this.data);
	}
	/**
	 *
	 * @param {string} key
	 * @returns
	 */
	has(key) {
		return this.keys().includes(key);
	}
	/**
	 *
	 * @param {string} key
	 * @returns
	 */
	delete(key) {
		const data = this.data;
		const result = delete data[key];
		SafeData(this.#source, this.#key, data);
		return result;
	}
}

/**
 * @template S
 */
export class XCacheDatabase {
	#source;
	#key;
	/** @type {Object} */
	#data;
	/**
	 * @param {S} source
	 * @param {import("./types.js").DBkey<S>} name
	 */
	constructor(source, name) {
		this.#source = source;
		this.#key = name;
	}
	get data() {
		if (!this.#data) this.#data = GetData(this.#source, this.#key);
		return this.#data;
	}
	safe() {
		SafeData(this.#source, this.#key, this.#data);
	}
}

/**
 * @param {object} source
 * @param {string | any} key
 * @returns {object}
 */
function GetData(source, key) {
	/** @type {import("./types.js").Source} */
	const t = source;

	let res = {};

	try {
		if (!key) throw new Error("No key!");
		const a = t.getDynamicProperty(key);
		if (typeof a !== "string") return res;
		res = JSON.parse(a);
	} catch (e) {
		err(e, source, key);
		return res;
	}

	return res;
}

/**
 * @param {object} source
 * @param {string | any} key
 * @param {object} data
 * @returns {object}
 */
function SafeData(source, key, data) {
	/** @type {import("./types.js").Source} */
	const t = source;

	try {
		if (!key) throw new Error("No key!");
		t.setDynamicProperty(key, JSON.stringify(data));
	} catch (e) {
		err(e, source, key);
	}
}

/**
 * @param {Error} e
 * @param {object} source
 * @param {string} key
 * @returns {void}
 */
function err(e, source, key) {
	ThrowError(
		{
			message: `${e.message ?? e}`,
			stack: e.stack,
		},
		1,
		[
			`§fsource: §6${
				source instanceof World ? "World" : source instanceof Player ? "Player" : typeof source + " §c(unknown)"
			}§f, key: §6${key}§r`,
		]
	);
}
