import { ItemStack } from "@minecraft/server";
import { MinecraftItemTypes } from "@minecraft/vanilla-data.js";
import { util } from "../util.js";
import { DB } from "./Default.js";
const TABLE_TYPE = "rubedo";
const CHUNK_REGEXP = new RegExp(".{1," + DB.MAX_LORE_SIZE + "}", "g");

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 * @typedef {Object} DatabaseEvents
 * @prop {(key: Key, value: Value) => Value} beforeGet This function will trigger until key get to db and can be used to modify data. For example, remove default values to keep db clean and lightweigth
 * @prop {(key: Key, value: Value) => Value} beforeSet This function will trigger until key set to db and can be used to modify data. For example, remove default values to keep db clean and lightweigth
 */

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
	static UUID = 0;
	/**
	 *
	 * @template {Database} Source
	 * @param {Source} source
	 * @param {Source["_"]["EVENTS"]} events
	 * @returns {Source}
	 */
	static eventProxy(source, events) {
		const proxy = {
			_: { EVENTS: events, PROXY_PATH: util.error.stack.get(1) },
		};
		Object.setPrototypeOf(proxy, source);
		Object.setPrototypeOf(proxy._, source._);
		// @ts-expect-error
		return proxy;
	}
	static async initAllTables() {
		this.isTablesInited = true;
		for (const table in this.tables) {
			this.tables[table].init();
		}
	}
	/**
	 * Record with all tables. Used to not reinit each of them
	 * @type {Record<string, Database<any, any>>}
	 */
	static tables = {};

	/**
	 * Data saved in memory
	 * @type {{ [key in Key]: Value }}
	 * @private
	 */
	// @ts-expect-error
	MEMORY = {};

	_ = {
		/** @private */
		parent: this,

		/**
		 * Raw string representation of whole database
		 */
		RAW_MEMORY: "{}",

		IS_INITED: false,
		TABLE_NAME: "",
		TABLE_TYPE,
		UUID: ++Database.UUID,
		/** @type {DatabaseEvents<Key, Value>} */
		EVENTS: {
			beforeSet(key, value) {
				return value;
			},
			beforeGet(key, value) {
				return value;
			},
		},
		/**
		 * Saves data into this database
		 * @param {{ [key in Key]: Value; }} collection
		 */
		set COLLECTION(collection) {
			this.parent.MEMORY = collection;
			this.parent.save();
		},
		/**
		 * Gets all the keys and values
		 */
		get COLLECTION() {
			if (!this.IS_INITED) this.parent.failedTo("COLLECTION");

			return this.parent.MEMORY;
		},
		PATH: "",
		PROXY_PATH: "",
	};

	/**
	 *
	 * @param {string} tableName
	 * @param {{events?: DatabaseEvents<Key, Value>, defaultValue?: (key: Key) => Value extends JSONLike ? Partial<Value> : never}} [options]
	 */
	constructor(tableName, { events, defaultValue } = {}) {
		if (defaultValue) {
			events = {
				// @ts-expect-error
				beforeGet(key, value) {
					if (value && typeof value === "object")
						return DB.setDefaults(value, defaultValue(key));

					return value ?? defaultValue(key);
				},
				// @ts-expect-error
				beforeSet(key, value) {
					if (value && typeof value === "object")
						return DB.removeDefaults(value, defaultValue(key));

					return value ?? defaultValue(key);
				},
			};
		}
		if (tableName in Database.tables) {
			// DB with this name already exists...
			const db = Database.tables[tableName];
			return events ? Database.eventProxy(db, events) : db;
		}

		this._.TABLE_NAME = tableName;
		this._.PATH = util.error.stack.get();
		if (events) this._.EVENTS = events;
		if (Database.isTablesInited) this.init();

		Database.tables[tableName] = this;
	}
	/**
	 * Loads data to {@link Database.MEMORY}
	 * @private
	 */
	init() {
		const entity = DB.getTableEntity(TABLE_TYPE, this._.TABLE_NAME);

		if (!entity) {
			/** @private */
			this.noMemory = true;

			// 3 means that no any table or backup found, so we dont need to spam
			// about it for each db
			// if (DB.LOAD_TRY !== 3)
			// 	console.warn(
			// 		"§6No entities found for maybe unusable table §f" + this._.TABLE_NAME
			// 	);

			Reflect.set(this, "MEMORY", {});
			this._.IS_INITED = true;
			return;
		}

		let raw = "";
		const inventory = entity.getComponent("inventory").container;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item) continue;
			raw += item.getLore().join("");
		}

		try {
			const length = raw.length;
			const isJSON = length && raw[0] === "{" && raw[length - 1] === "}";

			this.MEMORY = isJSON ? JSON.parse(raw) : {};
		} catch (e) {
			util.error(e);
			Reflect.set(this, "MEMORY", {});
			this.save();
		}

		this._.RAW_MEMORY = raw;
		this._.IS_INITED = true;
	}
	/**
	 * Saves data into this database
	 * @private
	 */
	save() {
		if (!this._.IS_INITED) this.failedTo("save");

		this._.RAW_MEMORY = JSON.stringify(this.MEMORY);

		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link DB.MAX_LORE_SIZE} chars in a single lore
		 */
		const chunks = this._.RAW_MEMORY.match(CHUNK_REGEXP);
		const entity =
			DB.getTableEntity(TABLE_TYPE, this._.TABLE_NAME) ??
			DB.createTableEntity(TABLE_TYPE, this._.TABLE_NAME);
		const inventory = entity.getComponent("inventory").container;

		inventory.clearAll();

		if (!chunks) throw new DatabaseError("Failed to parse");
		if (chunks.length > inventory.size) {
			return util.error(
				new DatabaseError(
					"Too many data tried saved to table " + this._.TABLE_NAME,
				),
			);
		}

		for (let i = 0; i < chunks.length; i++) {
			let item = new ItemStack(MinecraftItemTypes.AcaciaBoat);
			item.setLore([chunks[i]]);
			inventory.setItem(i, item);
		}

		DB.backup();
	}

	/**
	 * Sets a key to a value in this table
	 * @param {Key} key  undefined
	 * @param {Value} value  undefined
	 */
	set(key, value) {
		Reflect.set(this.MEMORY, key, this._.EVENTS.beforeSet(key, value));
		return this.save();
	}

	/**
	 * Gets a value from this table
	 * @param {Key} key  undefined
	 * @returns {Value} the keys corresponding key
	 */
	get(key) {
		if (!this._.IS_INITED) this.failedTo("get", key);

		return this._.EVENTS.beforeGet(key, this.MEMORY[key]);
	}

	/**
	 * Shorthand for db.get(); and db.set(); pair
	 * @param {Key} key
	 * @example ```js
	 * // Get work
	 * const {data, save} = db.work(key)
	 *
	 * // Change values
	 * data.value = 10
	 *
	 * data.obj = { value2: 1 }
	 *
	 * // Save without specify key and data
	 * save()
	 * ```
	 */
	work(key) {
		let data = this.get(key);
		if (typeof data === "object") Object.assign({}, data);
		const self = this;

		return {
			data,
			save: () => self.set(key, data),
		};
	}
	/**
	 * Get all the keys in the table
	 * @returns {Key[]}
	 */
	keys() {
		if (!this._.IS_INITED) this.failedTo("keys");

		return Object.keys(this.MEMORY);
	}
	/**
	 * Get all the values in the table
	 * @returns {Value[]}
	 */
	values() {
		if (!this._.IS_INITED) this.failedTo("values");

		return Object.entries(this.MEMORY).map((e) =>
			// @ts-expect-error
			this._.EVENTS.beforeGet(e[0], e[1]),
		);
	}
	/**
	 * Get entries of the table
	 * @returns {[Key, Value][]}
	 */
	entries() {
		if (!this._.IS_INITED) this.failedTo("entries");

		// @ts-expect-error
		return Object.entries(this.MEMORY).map((e) => [
			e[0],
			// @ts-expect-error
			this._.EVENTS.beforeGet(e[0], e[1]),
		]);
	}
	/**
	 * Check if the key exists in the table
	 * @param {Key} key  the key to test
	 * @returns {boolean}
	 */
	has(key) {
		if (!this._.IS_INITED) this.failedTo("has", key);

		return Reflect.has(this.MEMORY, key);
	}
	/**
	 * Delete the key from the table
	 * @param {Key} key  the key to delete
	 */
	delete(key) {
		if (!this._.IS_INITED) this.failedTo("delete", key);

		Reflect.deleteProperty(this.MEMORY, key);
		return this.save();
	}
	/**
	 * Clear everything in the table
	 */
	clear() {
		if (!this._.IS_INITED) this.failedTo("clear");

		Reflect.set(this, "MEMORY", {});

		return this.save();
	}

	/**
	 * Throws error like this: (x11) Failed to call delete key 'server.type' on table 'basic'. Make sure you inited them and calling 'delete' after init.
	 * @param {string} method
	 * @param {string} key
	 * @returns {never}
	 * @private
	 */
	failedTo(method, key = "") {
		this.log[method] ??= { count: 0, date: Date.now() };

		const lm = this.log[method];
		lm.count++;

		throw new DatabaseError(
			`${lm.count > 0 ? `(x${lm.count}) ` : ""}Failed to call ${method}${
				key ? ` key "${key}"` : key
			} on table "${
				this._.TABLE_NAME
			}": Table is not inited. Make sure you called Database.initAllTables() before`,
		);
	}

	/**
	 * @private
	 * @type {Record<string, {count: number, date: number}>}
	 */
	log = {};
}

class DatabaseError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message);
	}
}
