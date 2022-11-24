import { BlockLocation, Entity, InventoryComponentContainer, ItemStack, Location, world } from "@minecraft/server";
import { XA } from "../../xapi.js";

/**
 * Minecraft Bedrock Item Database
 * @license MIT
 * @author Smell of curry
 * @version 1.0.0
 * --------------------------------------------------------------------------
 * Stores items in a database. This works by having a custom entity at a
 * location then it grabs that entity and ads items to it inventory
 * each item in the inventory is then stored in a scoreboard DB to find it
 * --------------------------------------------------------------------------
 */

/**
 * Where the entity is going to be at
 * @type {Location}
 */
const ENTITY_LOCATION = new Location(0, 0, 0);

try {
	world.getDimension("overworld").runCommand("tickingarea add 0 0 0 0 0 0 ItemDB true");
	console.warn("ItemDB tickingarea was created");
} catch (e) {}

const ENTITY_DATABSE_ID = "mcbehub:inventory2";

export class XItemDatabase {
	/**
	 * The name of the table
	 * @param {string} TABLE_NAME
	 */
	constructor(TABLE_NAME) {
		this.TABLE_NAME = TABLE_NAME;
	}

	/**
	 * Grabs all database entitys
	 * @returns {Array<Entity>}
	 */
	get ENTITIES() {
		const q = {};
		q.type = ENTITY_DATABSE_ID;
		q.location = ENTITY_LOCATION;
		q.tags = [this.TABLE_NAME];
		return [...world.getDimension("overworld").getEntities(q)];
	}

	/**
	 * Returns all items that are stored
	 * @returns {Array<ItemStack>}
	 */
	get ITEMS() {
		let ITEMS = [];
		for (const entity of this.ENTITIES) {
			/**
			 * @type {InventoryComponentContainer}
			 */
			const inv = XA.Entity.getI(entity);
			for (let i = 0; i < inv.size; i++) {
				const item = inv.getItem(i);
				if (!item) continue;
				ITEMS.push(item);
			}
		}
		return ITEMS;
	}
	items() {
		return this.ITEMS;
	}
	/**
	 * Gets a item by id from inv
	 * @param {string} id
	 */
	get(id) {
		const item = this.ITEMS.find((item) => item.getLore().includes(id));
		if (!item) return null;
		item.setLore(item.getLore().filter((i) => i !== id));
		return item;
	}

	/**
	 * Saves a item to the database
	 * @param {ItemStack} item
	 * @returns {string} an id to grab the item
	 */
	add(item, id = null) {
		let entity = null;
		for (const e of this.ENTITIES) {
			/**
			 * @type {InventoryComponentContainer}
			 */
			const inv = XA.Entity.getI(e);
			console.warn(inv.emptySlotsCount);
			if (inv.emptySlotsCount > 0) {
				entity = e;
				break;
			}
		}
		if (!entity) {
			world
				.getDimension("overworld")
				.getEntitiesAtBlockLocation(new BlockLocation(ENTITY_LOCATION.x, ENTITY_LOCATION.y, ENTITY_LOCATION.z))
				?.find((e) => e.typeId == ENTITY_DATABSE_ID && e.getTags().includes(this.TABLE_NAME))
				?.triggerEvent("despawn");
			try {
				entity = world.getDimension("overworld").spawnEntity(ENTITY_DATABSE_ID, ENTITY_LOCATION);
				entity.addTag(this.TABLE_NAME);
			} catch (eee) {
				console.warn(eee);
			}

			if (!entity) {
				let e = world.events.entityCreate.subscribe((data) => {
					if (data.entity.typeId == ENTITY_DATABSE_ID) {
						entity = data.entity;
						entity.addTag(this.TABLE_NAME);
						world.events.entityCreate.unsubscribe(e);
					}
				});
				world.getDimension("overworld").runCommand(`summon ${ENTITY_DATABSE_ID} 0 0 0`);
			}
		}
		/**
		 * @type {InventoryComponentContainer}
		 */
		const inv = XA.Entity.getI(entity);
		const ID = id ? id : Date.now();
		let lore = item.getLore() ?? [];
		lore.push(`${ID}`);
		item.setLore(lore);
		inv.addItem(item);
		return `${ID}`;
	}

	/**
	 * deletes a item from the chests
	 * @param {string} id
	 * @returns {boolean} If it deleted or not
	 */
	delete(id) {
		for (const entity of this.ENTITIES) {
			/**
			 * @type {InventoryComponentContainer}
			 */
			const inv = XA.Entity.getI(entity);
			for (let i = 0; i < inv.size; i++) {
				const item = inv.getItem(i);
				if (!item || !item.getLore().includes(id)) continue;
				inv.setItem(i, new ItemStack({ id: "minecraft:air" }));
				return true;
			}
		}
		return false;
	}
}
