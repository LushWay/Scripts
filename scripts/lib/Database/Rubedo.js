import {
	BlockLocation,
	DynamicPropertiesDefinition,
	Entity,
	EntityTypes,
	ItemStack,
	MinecraftItemTypes,
	world,
} from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";
import { DisplayError } from "../Setup/utils.js";

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	let def = new DynamicPropertiesDefinition();
	def.defineString("tableName", 30);
	def.defineNumber("index");
	propertyRegistry.registerEntityTypeDynamicProperties(
		def,
		EntityTypes.get(ENTITY_IDENTIFIER)
	);
});

const ENTITY_IDENTIFIER = "rubedo:database";
const ENTITY_LOCATION = new BlockLocation(0, -64, 0);
const INVENTORY_SIZE = 54;
const MAX_DATABASE_STRING_SIZE = 32000;
const CHUNK_REGEXP = new RegExp(".{1," + MAX_DATABASE_STRING_SIZE + "}", "g");

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
	static tablesInited = false;
	static initAllTables() {
		this.tablesInited = true;
		return Promise.all(
			Object.values(this.instances).map((table) => {
				const initing = table.init();
				initing.catch((err) =>
					DisplayError(err, 0, [`${table.tableName} init`])
				);

				return initing;
			})
		);
	}
	/** @type {Record<string, Database<any, any>>} */
	static instances = {};
	/**
	 * Creates a table entity that is used for data storage
	 * @param {string} tableName  undefined
	 * @param {number} [index] if not specified no index will be set
	 * @returns {Entity} *
	 */
	static createTableEntity(tableName, index) {
		const entity = DIMENSIONS.overworld.spawnEntity(
			ENTITY_IDENTIFIER,
			ENTITY_LOCATION
		);
		entity.setDynamicProperty("tableName", tableName);
		entity.nameTag = `§7Database Table: §f${tableName}§r`;
		if (index) entity.setDynamicProperty("index", index);
		return entity;
	}
	/**
	 * Gets all table Entities associated with this tableName
	 * @param {string} tableName  undefined
	 * @returns {Entity[]} *
	 */
	static getTableEntities(tableName) {
		try {
			const all = [
				...DIMENSIONS.overworld.getEntities({ type: ENTITY_IDENTIFIER }),
			];

			const filtered = all
				.filter((e) => e.getDynamicProperty("tableName") === tableName)
				.map((entity) => {
					let index = entity.getDynamicProperty("index");
					if (typeof index !== "number") index = 0;
					return { entity, index };
				})
				.sort((a, b) => a.index - b.index)
				.map((e) => e.entity);

			return filtered;
		} catch (e) {
			DisplayError(e);
			return [];
		}
	}
	/**
	 * Data saved in memory
	 * @type {{ [key in Key]: Value } | null}
	 * @private
	 */
	MEMORY = null;

	/**
	 *
	 * @param {string} tableName
	 */
	constructor(tableName) {
		if (tableName in Database.instances) return Database.instances[tableName];

		this.tableName = tableName;
		if (Database.tablesInited) this.initPromise = this.init();

		Database.instances[tableName] = this;
	}
	/**
	 * Saves data into this database
	 * @private
	 */
	async save() {
		if (!this.MEMORY)
			throw new Error(
				`Cannot save data on table '${this.tableName}' before initing them. Add await to world load to solve that`
			);

		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link MAX_DATABASE_STRING_SIZE} chars in a single lore
		 */
		let chunks = JSON.stringify(this.MEMORY).match(CHUNK_REGEXP);

		const entities = Database.getTableEntities(this.tableName);
		const totalEntities = Math.ceil(chunks.length / INVENTORY_SIZE);
		const entitiesToSpawn = totalEntities - entities.length;

		if (entitiesToSpawn > 0) {
			for (let i = 0; i < entitiesToSpawn; i++) {
				entities.push(Database.createTableEntity(this.tableName, i));
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
		for (let i = entities.length - 1; i >= chunkIndex / INVENTORY_SIZE; i--) {
			entities[i].triggerEvent("despawn");
		}
	}
	/**
	 * Grabs all data from this table
	 * @private
	 */
	async init() {
		let entities = Database.getTableEntities(this.tableName);

		if (entities.length < 1) {
			world.say("§cNo entities found for table " + this.tableName);
			this.noMemory = true;
			Reflect.set(this, "MEMORY", {});
			await this.save();
			return;
		}

		let stringifiedData = "";
		for (const entity of entities) {
			const inventory = entity.getComponent("inventory").container;
			for (let i = 0; i < inventory.size; i++) {
				const item = inventory.getItem(i);
				if (!item) continue;
				stringifiedData += item.getLore().join("");
			}
		}

		try {
			const isJSON = stringifiedData && /\{.+\}/.test(stringifiedData);
			this.MEMORY = isJSON ? JSON.parse(stringifiedData) : {};
		} catch (e) {
			DisplayError(e);
			Reflect.set(this, "MEMORY", {});
			await this.save();
		}

		this.stringifiedData = stringifiedData;
		this.isInited = true;
	}
	/**
	 * Sets a key to a value in this table
	 * @param {Key} key  undefined
	 * @param {Value} value  undefined
	 */
	set(key, value) {
		this.MEMORY[key] = value;
		return this.save();
	}

	/**
	 * Gets a value from this table
	 * @param {Key} key  undefined
	 * @returns {Value} the keys corresponding key
	 */
	get(key) {
		if (!this.MEMORY) throw new Error("Get: Entities not loaded!");
		return this.MEMORY[key];
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
		const T = this;

		return {
			data,
			save: () => T.set(key, data),
		};
	}
	/**
	 * Get all the keys in the table
	 * @returns {Key[]}
	 */
	keys() {
		if (!this.MEMORY) throw new Error("Keys: Entities not loaded!");
		// @ts-expect-error
		return Object.keys(this.MEMORY);
	}
	/**
	 * Get all the values in the table
	 * @returns {Value[]}
	 */
	values() {
		if (!this.MEMORY) throw new Error("Values: Entities not loaded!");
		return Object.values(this.MEMORY);
	}
	/**
	 * Check if the key exists in the table
	 * @param {Key} key  the key to test
	 * @returns {boolean}
	 */
	has(key) {
		if (!this.MEMORY) throw new Error("Has: Entities not loaded!");

		return Reflect.has(this.MEMORY, key);
	}
	/**
	 * Saves data into this database
	 * @param {{ [key in Key]: Value; }} collection
	 */
	set collection(collection) {
		this.MEMORY = collection;
		this.save();
	}
	/**
	 * Gets all the keys and values
	 */
	get collection() {
		if (!this.MEMORY) throw new Error("Collection: Entities not loaded!");
		return this.MEMORY;
	}
	/**
	 * Delete the key from the table
	 * @param {Key} key  the key to delete
	 */
	delete(key) {
		if (!this.MEMORY) throw new Error("Delete: Entities not loaded!");
		Reflect.deleteProperty(this.MEMORY, key);
		return this.save();
	}
	/**
	 * Clear everything in the table
	 */
	clear() {
		if (!this.MEMORY) throw new Error("Clear: Entities not loaded!");
		Object.assign(this.MEMORY, {});
		return this.save();
	}
}
