import {
	BlockLocation,
	DynamicPropertiesDefinition,
	Entity,
	EntityTypes,
	ItemStack,
	Location,
	MinecraftItemTypes,
	world,
} from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";
import { onWorldLoad } from "../Setup/loader.js";
import { ThrowError } from "../Setup/utils.js";

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	let def = new DynamicPropertiesDefinition();
	def.defineString("tableName", 30);
	def.defineNumber("index");
	propertyRegistry.registerEntityTypeDynamicProperties(
		def,
		EntityTypes.get(ENTITY_IDENTIFIER)
	);
});

const MAX_DATABASE_STRING_SIZE = 32000;
const ENTITY_IDENTIFIER = "rubedo:database";
const ENTITY_LOCATION = new BlockLocation(0, -64, 0);
const INVENTORY_SIZE = 54;
const CHUNK_REGEXP = new RegExp(".{1," + MAX_DATABASE_STRING_SIZE + "}", "g");

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
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
			const all = DIMENSIONS.overworld.getEntities({
				location: new Location(
					ENTITY_LOCATION.x,
					ENTITY_LOCATION.y,
					ENTITY_LOCATION.z
				),
				maxDistance: 5,
			});

			const filtered = [...all].filter(
				(e) =>
					e &&
					e.typeId === ENTITY_IDENTIFIER &&
					e.getDynamicProperty("tableName") === tableName
			);

			return filtered;
		} catch (e) {
			ThrowError(e);
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
	 * List of queued tasks on this table
	 * @type {Array<() => void>}
	 * @private
	 */
	QUEUE = [];
	/**
	 *
	 * @param {string} tableName
	 */
	constructor(tableName) {
		if (tableName in Database.instances) return Database.instances[tableName];
		this.tableName = tableName;
		onWorldLoad(async () => {
			await this.init();
			this.QUEUE.forEach((v) => v());
		});
		Database.instances[tableName] = this;
	}
	/**
	 * Adds a queue task to be awaited
	 * @returns {Promise<void>} once its this items time to run in queue
	 * @private
	 */
	async addQueueTask() {
		return new Promise((resolve) => this.QUEUE.push(resolve));
	}
	/**
	 * Saves data into this database
	 * @private
	 */
	save() {
		// if (!this.MEMORY) await this.addQueueTask();

		let entities = Database.getTableEntities(this.tableName);

		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link MAX_DATABASE_STRING_SIZE} chars in a single lore
		 */
		let chunks = JSON.stringify(this.MEMORY).match(CHUNK_REGEXP);

		/**
		 * The amount of entities that is needed to store {@link chunks} data
		 */
		const entitiesNeeded =
			Math.ceil(chunks.length / INVENTORY_SIZE) - entities.length;
		if (entitiesNeeded > 0) {
			for (let i = 0; i < entitiesNeeded; i++) {
				entities.push(Database.createTableEntity(this.tableName));
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
		this.isInited = true;
		let entities = Database.getTableEntities(this.tableName);
		entities = entities.sort(
			//@ts-expect-error
			(a, b) => a.getDynamicProperty("index") - b.getDynamicProperty("index")
		);
		let stringifiedData = "";
		for (const entity of entities) {
			const inventory = entity.getComponent("inventory").container;
			for (let i = 0; i < inventory.size; i++) {
				const item = inventory.getItem(i);
				if (!item) continue;
				stringifiedData += item.getLore().join("");
			}
		}
		this.stringifiedData = stringifiedData;
		try {
			this.MEMORY = stringifiedData ? JSON.parse(stringifiedData) : {};
		} catch (e) {
			ThrowError(e);
		}
		this.sucInit = true;
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
		if (!this.MEMORY) throw new Error("Entities not loaded!");
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
		return this.MEMORY && typeof this.MEMORY === "object" && key in this.MEMORY;
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
