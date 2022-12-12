import { BlockLocation, Entity, ItemStack, MinecraftItemTypes, world } from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";

const MAX_DATABASE_STRING_SIZE = 32000;
const ENTITY_IDENTIFIER = "rubedo:database";
const ENTITY_LOCATION = new BlockLocation(0, -64, 0);

/**
 * Splits a string into chunk sizes
 * @param {string} str
 * @param {number} length
 * @returns {string[]}
 */
function chunkString(str, length) {
	return str.match(new RegExp(".{1," + length + "}", "g"));
}

/** @type {Record<string, EntityDatabase<any>>} */
export const CreatedInstances = {};

/**
 * @template [Type = never]
 */
export class EntityDatabase {
	/**
	 * The databse name
	 * @type {string}
	 * @private
	 */
	name;
	/**
	 * The entitys this database has saved, used for memory and speed
	 * @type {Array<Entity>?}
	 * @private
	 */
	savedEntitys;
	/**
	 * Stores the information that this databse has saved
	 * @type {any | undefined}
	 * @private
	 */
	MEMORY;
	/**
	 * Compresses a value into a shorter string
	 * @param {string} string  value to compress
	 * @returns {string}
	 */
	static compress(string) {
		//return LZString.compress(string);
		return string;
	}
	/**
	 * Compresses a value into a shorter string
	 * @param {string} string  value to compress
	 * @returns {string}
	 */
	static decompress(string) {
		//return LZString.decompress(string);
		return string;
	}
	/**
	 * Creates a new Database Entity
	 * @param {string} name  the database name
	 * @param {number} index  the index this entity is
	 * @returns {Entity} Entity that was made
	 */
	static createEntity(name, index) {
		let entity = DIMENSIONS.overworld.spawnEntity(ENTITY_IDENTIFIER, ENTITY_LOCATION);
		entity.setDynamicProperty("name", name);
		entity.setDynamicProperty("index", index);
		const inv = entity.getComponent("inventory").container;
		const defaultItem = new ItemStack(MinecraftItemTypes.acaciaBoat, 1);
		if (index == 0) defaultItem.nameTag = "{}";
		inv.setItem(0, defaultItem);
		return entity;
	}

	/**
	 * Gets the nameTag of the slot from the entitys inventory
	 * @param {Entity} entity  entity to grab from
	 * @param {number} slot  slot value to get
	 * @returns {string}
	 */
	static getInventorySlotName(entity, slot) {
		const inv = entity.getComponent("inventory").container;
		return inv.getItem(slot)?.nameTag;
	}
	/**
	 * Sets the nameTag of the slot from the entitys inventory
	 * @param {Entity} entity  entity to grab from
	 * @param {number} slot  slot value to get
	 * @param {string} value  the value to set it to
	 * @returns {void}
	 */
	static setInventorySlotName(entity, slot, value) {
		const inv = entity.getComponent("inventory").container;
		let item = inv.getItem(slot);
		item.nameTag = value;
		return inv.setItem(slot, item);
	}
	/**
	 * Creates a new Database
	 * @param {string} name max length 16
	 */
	constructor(name) {
		if (CreatedInstances[name]) return CreatedInstances[name];
		this.name = name;
		CreatedInstances[name] = this;
	}
	/**
	 * Grabs all entities this database is associated with
	 * @returns {Array<Entity>}
	 */
	get entitys() {
		if (this.savedEntitys) return this.savedEntitys;
		const ens = DIMENSIONS.overworld
			.getEntitiesAtBlockLocation(ENTITY_LOCATION)
			.filter((e) => e.typeId == ENTITY_IDENTIFIER && e.getDynamicProperty("name") == this.name);
		this.savedEntitys = ens;
		return ens;
	}
	/**
	 * Grabs the data of this name out of the local database
	 * @returns {{ [key: string]: Type; }}
	 */
	data() {
		if (this.MEMORY) return this.MEMORY;
		if (this.entitys.length == 0) EntityDatabase.createEntity(this.name, 0);
		// If there is only one entity there is no need to sort the data out
		if (this.entitys.length == 1) {
			let data = JSON.parse(EntityDatabase.decompress(EntityDatabase.getInventorySlotName(this.entitys[0], 0)));
			this.MEMORY = data;
			return data;
		}
		let data = new Array(this.entitys.length);
		for (const entity of this.entitys) {
			let index = entity.getDynamicProperty("index");
			if (typeof index !== "number") throw new TypeError("Given index type doesnt match number");
			data[index] = EntityDatabase.getInventorySlotName(entity, 0);
		}

		let newdata;
		try {
			newdata = JSON.parse(data.join(""));
		} catch (error) {
			newdata = {};
		}
		this.MEMORY = data;
		return newdata;
	}
	/**
	 * Saves data into the database
	 * @param {{ [key: string]: Type }} data  data to save
	 * @returns {void}
	 */
	save(data) {
		this.MEMORY = data;
		/**
		 * Splits the data into chunks to then save across an array of entitys
		 */
		const dataSplit = chunkString(EntityDatabase.compress(JSON.stringify(data)), MAX_DATABASE_STRING_SIZE);
		if (this.entitys && dataSplit.length == this.entitys.length) {
			for (let i = 0; i < dataSplit.length; i++) {
				EntityDatabase.setInventorySlotName(this.entitys[i], 0, dataSplit[i]);
			}
		} else {
			// there is either no entitys or a diffrent amount
			this.entitys?.forEach((e) => e?.triggerEvent("despawn"));
			delete this.savedEntitys;
			for (let i = 0; i < dataSplit.length; i++) {
				const entity = EntityDatabase.createEntity(this.name, i);
				EntityDatabase.setInventorySlotName(entity, 0, dataSplit[i]);
			}
		}
	}
	/**
	 * Sets a key to a value in this database
	 * @param {string} key  key to set
	 * @param {Type} value  value to set the key to
	 * @returns {void}
	 */
	set(key, value) {
		const data = this.data();
		data[key] = value;
		this.save(data);
	}
	/**
	 * Grabs a value from the database by key
	 * @param {string} key  value to grab
	 * @returns {Type}
	 */
	get(key) {
		return this.data()[key];
	}
	/**
	 * Check if the key exists in the table
	 * @param {string} key  the key to test
	 * @returns {boolean}
	 */
	has(key) {
		return this.keys().includes(key);
	}
	/**
	 * Delete the key from the table
	 * @param {string} key  the key to test
	 * @returns {boolean}
	 */
	delete(key) {
		let data = this.data();
		const status = delete data[key];
		this.save(data);
		return status;
	}
	/**
	 * Returns the number of key/value pairs in the Map object.
	 * @returns {number}
	 */
	size() {
		return this.keys().length;
	}
	/**
	 * Clear everything in the table
	 * @returns {void}
	 */
	clear() {
		this.save({});
	}
	/**
	 * Get all the keys in the table
	 * @returns {string[]}
	 */
	keys() {
		return Object.keys(this.data());
	}
	/**
	 * Get all the values in the table
	 * @returns {Type[]}
	 */
	values() {
		return Object.values(this.data());
	}
	/**
	 * Gets all the keys and values
	 * @returns {{ [key: string]: Type; }}
	 */
	getCollection() {
		return this.data();
	}
}
