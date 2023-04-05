import { Entity, ItemStack } from "@minecraft/server";
import { DB } from "./Default.js";

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

const TABLE_TYPE = "item";

export class XItemDatabase {
	_ = {
		TABLE_TYPE,
		TABLE_NAME: "",
	};
	/**
	 * The name of the table
	 * @param {string} TABLE_NAME
	 */
	constructor(TABLE_NAME) {
		/** @private */
		this._.TABLE_NAME = TABLE_NAME;
	}

	/**
	 * @type {Entity}
	 * @private
	 */
	entity = null;

	/** @private */
	get ENTITY() {
		this.entity ??= DB.getTableEntity(TABLE_TYPE, this._.TABLE_NAME);
		return this.entity;
	}

	/**
	 * Returns all items that are stored
	 * @returns {Array<ItemStack>}
	 * @private
	 */
	get ITEMS() {
		const ITEMS = [];

		const inventory = this.entity.getComponent("inventory").container;

		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item) continue;
			ITEMS.push(item);
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
		return this.ITEMS.find((item) => {
			const [item_id, ...lore] = item.getLore();
			if (item_id !== id) return false;

			item.setLore(lore);
			return true;
		});
	}

	/**
	 * Saves a item to the database
	 * @param {ItemStack} item
	 * @param {string} id
	 * @returns {string} an id to grab the item
	 *
	 */
	add(item, id = null) {
		const inventory = this.entity.getComponent("inventory").container;
		const ID = id ?? Date.now().toString();
		const lore = item.getLore();
		lore.unshift(ID);
		item.setLore(lore);

		inventory.addItem(item);
		return ID;
	}

	/**
	 * deletes a item from the chests
	 * @param {string} id
	 * @returns {boolean} If it deleted or not
	 */
	delete(id) {
		const inventory = this.entity.getComponent("inventory").container;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);

			if (!item || item.getLore()[0] !== id) continue;
			inventory.setItem(i, new ItemStack({ id: "minecraft:air" }));
			return true;
		}

		return false;
	}
}
