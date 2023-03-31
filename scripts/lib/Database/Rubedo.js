import {
	Entity,
	ItemStack,
	MinecraftItemTypes,
	Vector,
	world,
} from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";
import { DisplayError } from "../Setup/utils.js";
import { DB } from "./Defaults.js";

const TABLE_TYPE = "rubedo";
const CHUNK_REGEXP = new RegExp(".{1," + DB.MAX_LORE_SIZE + "}", "g");

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
	static tablesInited = false;
	static initAllTables() {
		this.tablesInited = true;
		return Promise.all(
			Object.values(this.tables).map((table) => {
				const initing = table.init();
				initing.catch((err) =>
					DisplayError(err, 0, [`${table.TABLE_NAME} init`])
				);

				return initing;
			})
		);
	}
	/** @type {Record<string, Database<any, any>>} */
	static tables = {};
	/**
	 * Creates a table entity that is used for data storage
	 * @param {string} tableName  undefined
	 * @param {number} [index] if not specified no index will be set
	 * @returns {Entity} *
	 */
	static createTableEntity(tableName, index = 0) {
		const entity = DIMENSIONS.overworld.spawnEntity(
			DB.ENTITY_IDENTIFIER,
			DB.ENTITY_LOCATION
		);
		entity.setDynamicProperty("tableName", tableName);
		entity.setDynamicProperty("index", index);
		entity.setDynamicProperty("tableType", TABLE_TYPE);
		entity.nameTag = `§7DB §f${tableName}§r`;
		return entity;
	}
	/**
	 * @type {{
	 *   entity: Entity;
	 *   index: number;
	 *   tableName: string | number | boolean;
	 * }[]}
	 */
	static allDB;
	static all() {
		this.allDB ??= DIMENSIONS.overworld
			.getEntities({ type: DB.ENTITY_IDENTIFIER })
			.map((entity) => {
				let index = entity.getDynamicProperty("index");
				if (typeof index !== "number") index = 0;

				const tableType = entity.getDynamicProperty("tableType") === TABLE_TYPE;
				const tableName = entity.getDynamicProperty("tableName");
				world.debug(tableName, tableType);
				if (typeof tableName !== "string")
					return { entity, index, tableName: "NOTDB" };

				const loc = entity.location;
				if (Vector.distance(loc, DB.ENTITY_LOCATION) > 1)
					entity.teleport(DB.ENTITY_LOCATION);

				return {
					entity,
					index,
					tableName,
				};
			})
			.filter((e) => e.tableName !== "NOTDB");

		return this.allDB;
	}
	/**
	 * Gets all table Entities associated with this tableName
	 * @param {string} tableName  undefined
	 * @returns {Entity[]} *
	 */
	static getTableEntities(tableName) {
		try {
			return this.all()
				.filter((e) => e.tableName === tableName)
				.sort((a, b) => a.index - b.index)
				.map((e) => e.entity);
		} catch (e) {
			DisplayError(e);
			return [];
		}
	}
	/**
	 * Returns all private methods
	 * @param {Database} DB
	 */
	static private(DB) {
		const { initPromise, raw, isInited } = DB;
		return { initPromise, raw, isInited };
	}

	/**
	 * Data saved in memory
	 * @type {{ [key in Key]: Value } | null}
	 * @private
	 */
	MEMORY = null;

	/**
	 * @type {Promise<void>}
	 * @private
	 */
	initPromise = null;

	/** @private */
	isInited = false;

	/** @private */
	raw = "{}";

	/**
	 * @template {keyof this["events"]} EventName
	 * @param {EventName} event
	 * @param {this["events"][EventName]} callback
	 */
	on(event, callback) {
		// @ts-expect-error Trust me, TS
		this.events[event] = callback;
	}
	// /** @private */
	events = {
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
	};

	/**
	 *
	 * @param {string} tableName
	 */
	constructor(tableName) {
		if (tableName in Database.tables) return Database.tables[tableName];

		this.TABLE_NAME = tableName;
		if (Database.tablesInited) this.initPromise = this.init();

		Database.tables[tableName] = this;
	}
	/**
	 * Saves data into this database
	 * @private
	 */
	async save() {
		if (!this.isInited) this.failedTo("save");

		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link MAX_DATABASE_STRING_SIZE} chars in a single lore
		 */
		let chunks = JSON.stringify(this.MEMORY).match(CHUNK_REGEXP);

		const entities = Database.getTableEntities(this.TABLE_NAME);
		const totalEntities = Math.ceil(chunks.length / DB.INVENTORY_SIZE);
		const entitiesToSpawn = totalEntities - entities.length;

		if (entitiesToSpawn > 0) {
			for (let i = 0; i < entitiesToSpawn; i++) {
				entities.push(Database.createTableEntity(this.TABLE_NAME, i));
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
	 * Grabs all data from this table
	 * @private
	 */
	async init() {
		let entities = Database.getTableEntities(this.TABLE_NAME);

		if (entities.length < 1) {
			/** @private */
			this.noMemory = true;

			console.warn(
				"§cNo entities found for maybe unusable table §f" + this.TABLE_NAME
			);

			Reflect.set(this, "MEMORY", {});
			this.isInited = true;
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
			await this.save();
		}

		this.raw = raw;
		this.isInited = true;
	}

	/**
	 * Sets a key to a value in this table
	 * @param {Key} key  undefined
	 * @param {Value} value  undefined
	 */
	set(key, value) {
		Reflect.set(this.MEMORY, key, this.events.beforeSet(key, value));
		return this.save();
	}

	/**
	 * Gets a value from this table
	 * @param {Key} key  undefined
	 * @returns {Value} the keys corresponding key
	 */
	get(key) {
		if (!this.isInited) this.failedTo("get", key);

		return this.events.beforeGet(key, this.MEMORY[key]);
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
		if (!this.isInited) this.failedTo("keys");

		// @ts-expect-error
		return Object.keys(this.MEMORY);
	}
	/**
	 * Get all the values in the table
	 * @returns {Value[]}
	 */
	values() {
		if (!this.isInited) this.failedTo("values");

		return Object.entries(this.MEMORY).map((e) =>
			// @ts-expect-error
			this.events.beforeGet(e[0], e[1])
		);
	}
	/**
	 * Get entries of the table
	 */
	entries() {
		if (!this.isInited) this.failedTo("entries");

		return Object.entries(this.MEMORY).map((e) =>
			// @ts-expect-error
			[e[0], this.events.beforeGet(e[0], e[1])]
		);
	}
	/**
	 * Check if the key exists in the table
	 * @param {Key} key  the key to test
	 * @returns {boolean}
	 */
	has(key) {
		if (!this.isInited) this.failedTo("has", key);

		return Reflect.has(this.MEMORY, key);
	}
	/**
	 * Saves data into this database
	 * @param {{ [key in Key]: Value; }} collection
	 */
	set COLLECTION(collection) {
		this.MEMORY = collection;
		this.save();
	}
	/**
	 * Gets all the keys and values
	 */
	get COLLECTION() {
		if (!this.isInited) this.failedTo("COLLECTION");

		return this.MEMORY;
	}
	/**
	 * Delete the key from the table
	 * @param {Key} key  the key to delete
	 */
	delete(key) {
		if (!this.isInited) this.failedTo("delete", key);

		Reflect.deleteProperty(this.MEMORY, key);
		return this.save();
	}
	/**
	 * Clear everything in the table
	 */
	clear() {
		if (!this.isInited) this.failedTo("clear");

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
				this.TABLE_NAME
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

