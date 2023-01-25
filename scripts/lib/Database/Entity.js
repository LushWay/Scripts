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
import { onWorldLoad } from "../Setup/loader.js";

world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
	let def = new DynamicPropertiesDefinition();
	def.defineString("tableName", 30);
	def.defineNumber("index");
	propertyRegistry.registerEntityTypeDynamicProperties(def, EntityTypes.get(ENTITY_IDENTIFIER));
});

const MAX_DATABASE_STRING_SIZE = 32000;
const ENTITY_IDENTIFIER = "rubedo:database";
const ENTITY_LOCATION = new BlockLocation(0, -64, 0);
const INVENTORY_SIZE = 128;

/**
 * @template {string} [Key = string]
 * @template [Value=any]
 */
export class Database {
	/** @type {Record<string, Database<any, any>>} */
	static instances = {};
	static chunkRegexp = new RegExp(".{1," + MAX_DATABASE_STRING_SIZE + "}", "g");
	/**
	 * Creates a table entity that is used for data storage
	 * @param {string} tableName  undefined
	 * @param {number} [index] if not specified no index will be set
	 * @returns {Entity} *
	 */
	static createTableEntity(tableName, index) {
		const entity = DIMENSIONS.overworld.spawnEntity(ENTITY_IDENTIFIER, ENTITY_LOCATION);
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
			return DIMENSIONS.overworld
				.getEntitiesAtBlockLocation(ENTITY_LOCATION)
				.filter((e) => e?.typeId === ENTITY_IDENTIFIER && e?.getDynamicProperty("tableName") === tableName);
		} catch (e) {
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
			await this.initData();
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
		return new Promise((resolve) => {
			this.QUEUE.push(() => {
				resolve();
			});
		});
	}
	/**
	 * Saves data into this database
	 * @returns {Promise<void>} once data is saved
	 * @private
	 */
	async saveData() {
		if (!this.MEMORY) await this.addQueueTask();

		let entities = Database.getTableEntities(this.tableName);
		/**
		 * The split chunks of the stringified data, This is done because we can
		 * only store {@link MAX_DATABASE_STRING_SIZE} chars in a single nameTag
		 */
		let chunks = JSON.stringify(this.MEMORY).match(Database.chunkRegexp);

		/**
		 * The amount of entities that is needed to store {@link chunks} data
		 */
		const entitiesNeeded = Math.ceil(chunks.length / INVENTORY_SIZE) - entities.length;
		if (entitiesNeeded > 0) {
			for (let i = 0; i < entitiesNeeded; i++) {
				entities.push(Database.createTableEntity(this.tableName));
			}
		}

		let chunkIndex = 0;
		for (const [i, entity] of entities.entries()) {
			const inventory = entity.getComponent("inventory").container;
			while (chunkIndex < chunks.length && inventory.size > 0) {
				let item = new ItemStack(MinecraftItemTypes.acaciaBoat);
				item.nameTag = chunks[chunkIndex];
				inventory.setItem(i, item);
				chunkIndex++;
			}
			// Set all unUsed slots to air
			for (let i = inventory.size; i < INVENTORY_SIZE; i++) {
				inventory.setItem(i, new ItemStack(MinecraftItemTypes.stick, 0));
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
	 * @returns {Promise<{ [key in Key]: Value; }>}
	 * @private
	 */
	async initData() {
		let entities = Database.getTableEntities(this.tableName).sort(
			//@ts-expect-error
			(a, b) => a.getDynamicProperty("index") - b.getDynamicProperty("index")
		);
		let stringifiedData = "";
		for (const entity of entities) {
			const inventory = entity.getComponent("inventory").container;
			for (let i = 0; i < inventory.size; i++) {
				const item = inventory.getItem(i);
				if (!item) continue;
				stringifiedData = stringifiedData + item.nameTag;
			}
		}
		const data = stringifiedData == "" ? {} : JSON.parse(stringifiedData);
		this.ss = stringifiedData;
		this.MEMORY = data;
		return data;
	}
	/**
	 * Sets a key to a value in this table
	 * @param {Key} key  undefined
	 * @param {Value} value  undefined
	 * @returns {Promise<void>}
	 */
	set(key, value) {
		this.MEMORY[key] = value;
		return this.saveData();
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
	 * Gets a value async from this table, this should be used on calls from like
	 * entityCreate, system.runSchedule or things that could be before database entities spawn
	 * @param {Key} key  undefined
	 * @returns {Promise<Value>}
	 */
	async getSync(key) {
		if (this.MEMORY) return this.get(key);
		await this.addQueueTask();
		return this.MEMORY[key];
	}
	/**
	 * Get all the keys in the table
	 * @returns {Key[]}
	 */
	keys() {
		if (!this.MEMORY) throw new Error("Entities not loaded!");
		// @ts-expect-error
		return Object.keys(this.MEMORY);
	}
	/**
	 * Get all the values in the table
	 * @returns {Value[]}
	 */
	values() {
		if (!this.MEMORY) throw new Error("Entities not loaded!");
		return Object.values(this.MEMORY);
	}
	/**
	 * Check if the key exists in the table
	 * @param {Key} key  the key to test
	 * @returns {boolean}
	 */
	has(key) {
		if (!this.MEMORY) throw new Error("Entities not loaded!");
		return Object.keys(this.MEMORY).includes(key);
	}
	/**
	 *  Saves data into this database
	 * @param {{ [key in Key]: Value; }} collection
	 * @returns {Promise<void>} once data is saved
	 */
	set collection(collection) {
		this.MEMORY = collection;
		this.saveData();
	}
	/**
	 * Gets all the keys and values
	 * @returns {{ [key in Key]: Value; }}
	 */
	get collection() {
		if (!this.MEMORY) throw new Error("Entities not loaded!");
		return this.MEMORY;
	}
	/**
	 * Delete the key from the table
	 * @param {Key} key  the key to delete
	 * @returns {Promise<boolean>}
	 */
	async delete(key) {
		const status = Reflect.deleteProperty(this.MEMORY, key);
		await this.saveData();
		return status;
	}
	/**
	 * Clear everything in the table
	 * @returns {Promise<void>}
	 */
	async clear() {
		// @ts-expect-error
		this.MEMORY = {};
		return await this.saveData();
	}
}
