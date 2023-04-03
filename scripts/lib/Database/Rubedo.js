import { ItemStack, MinecraftItemTypes } from "@minecraft/server";
import { DisplayError } from "../Setup/utils.js";
import { DB } from "./Default.js";

const TABLE_TYPE = "rubedo";
const CHUNK_REGEXP = new RegExp(".{1," + DB.MAX_LORE_SIZE + "}", "g");

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
	/**
	 *
	 * @template {Database} Source
	 * @param {Source} source
	 * @param {Source["_"]["EVENTS"]} events
	 * @returns {Source}
	 */
	static eventProxy(source, events) {
		/**
		 * @type {{_: Pick<Source["_"], "EVENTS">}}
		 */
		const proxy = {
			...source,
			_: { ...source._, EVENTS: events },
		};
		return Object.setPrototypeOf(proxy, source);
	}
	static initAllTables() {
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
	 * @type {{ [key in Key]: Value } | null}
	 * @private
	 */
	MEMORY = null;

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
		EVENTS: {
			/**
			 * This function will trigger until key set to db and can be used to modify data. For example, remove default values to keep db clean and lightweigth
			 * @param {Key} key
			 * @param {Value} value
			 * @returns {Value}
			 */
			beforeSet(key, value) {
				return value;
			},
			/**
			 * This function will trigger until key get from db and can be used to modify data. For example, add default values to keep db clean and lightweigth
			 * @param {Key} key
			 * @param {Value} value
			 * @returns {Value}
			 */
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
	};

	/**
	 *
	 * @param {string} tableName
	 * @param {{
	 *  beforeSet(key: Key, value: Value): Value;
	 * beforeGet(key: Key, value: Value): Value;
	 * }} [events]
	 */
	constructor(tableName, events) {
		if (tableName in Database.tables) {
			// DB with this name already exists...

			return Database.tables[tableName];
		}

		this._.TABLE_NAME = tableName;
		if (events) this._.EVENTS = events;
		if (Database.isTablesInited) this.init();

		Database.tables[tableName] = this;
	}
	/**
	 * Loads data to {@link Database.MEMORY}
	 * @private
	 */
	init() {
		let entities = DB.getTableEntities(TABLE_TYPE, this._.TABLE_NAME);

		if (entities.length < 1) {
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
		for (const entity of entities) {
			const inventory = entity.getComponent("inventory").container;
			for (let i = 0; i < inventory.size; i++) {
				const item = inventory.getItem(i);
				if (!item) continue;
				raw += item.getLore().join("");
			}
		}

		try {
			const length = raw.length;
			const isJSON = length && raw[0] === "{" && raw[length - 1] === "}";

			this.MEMORY = isJSON ? JSON.parse(raw) : {};
		} catch (e) {
			DisplayError(e);
			Reflect.set(this, "MEMORY", {});
			this.save();
		}

		this._.RAW_MEMORY = raw;
		this._.IS_INITED = true;
	}

	/**
	 * @template {keyof this["_"]["EVENTS"]} EventName
	 * @param {EventName} event
	 * @param {this["_"]["EVENTS"][EventName]} callback
	 */
	on(event, callback) {
		// @ts-expect-error Trust me, TS
		this._.EVENTS[event] = callback;
	}
	/**
	 * Saves data into this database
	 * @private
	 */
	save() {
		if (!this._.IS_INITED) this.failedTo("save");

		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link MAX_DATABASE_STRING_SIZE} chars in a single lore
		 */
		let chunks = JSON.stringify(this.MEMORY).match(CHUNK_REGEXP);

		const entities = DB.getTableEntities(TABLE_TYPE, this._.TABLE_NAME);
		const totalEntities = Math.ceil(chunks.length / DB.INVENTORY_SIZE);
		const entitiesToSpawn = totalEntities - entities.length;

		if (entitiesToSpawn > 0) {
			for (let i = 0; i < entitiesToSpawn; i++) {
				entities.push(DB.createTableEntity(this._.TABLE_NAME, TABLE_TYPE, i));
			}
		}

		let chunkIndex = 0;
		for (const [i, entity] of entities.entries()) {
			const inventory = entity.getComponent("inventory").container;
			inventory.clearAll();

			while (chunkIndex < chunks.length && inventory.size > 0) {
				let item = new ItemStack(MinecraftItemTypes.acaciaBoat);
				item.setLore([chunks[chunkIndex]]);
				inventory.setItem(i, item);
				chunkIndex++;
			}
			entity.setDynamicProperty("index", i);
		}
		// Check for unUsed entities and despawn them
		for (
			let i = entities.length - 1;
			i >= chunkIndex / DB.INVENTORY_SIZE;
			i--
		) {
			entities[i].triggerEvent("despawn");
		}
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
		const data = this.get(key);
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

		// @ts-expect-error
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
			this._.EVENTS.beforeGet(e[0], e[1])
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
	 * @private
	 */
	failedTo(method, key = "") {
		this.log[method] ??= { count: 0, date: Date.now() };

		const lm = this.log[method];
		lm.count++;

		// Disable spam (Limit: one error per 10 seconds)
		if (Date.now() - lm.date < 10000) return;

		throw new DatabaseError(
			`${lm.count > 0 ? `(x${lm.count}) ` : ""}Failed to call ${method}${
				key ? ` key "${key}"` : key
			} on table "${
				this._.TABLE_NAME
			}". Try to call "${method}" after resolving of §fDatabase.system(§6db§f).initPromise`
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
