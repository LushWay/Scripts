import { Entity, ItemStack, Player, world } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";

/** @type {Database<string, IJoinData>} */
const DB = new Database("player", {
	beforeGet(key, value) {
		return value ?? {};
	},
	beforeSet(key, value) {
		return value;
	},
});

/**
 * @author Smell of Curry, mrpatches123, mo9ses, xiller228 (Leaftail)
 */

export const XEntity = {
	/**
	 * Gets player name from player database with specific ID
	 * @param {string} ID
	 */
	getNameByID(ID) {
		return DB.get(ID)?.name;
	},
	/**
	 * Returns a location of the inputed aguments
	 * @param {Entity} entity your using
	 * @param {string} value what you want to search for
	 * @example getTagStartsWith(Entity, "stuff:")
	 */
	getTagStartsWith(entity, value) {
		const tags = entity.getTags();
		const tag = tags.find(
			(tag) => tag?.startsWith(value) && tag?.length > value.length
		);
		return tag ? tag.substring(value.length) : null;
	},
	/**
	 * Returns a location of the inputed aguments
	 * @param {Entity} entity your using
	 * @param {string} value what you want to search for
	 * @returns {void}
	 * @example removetTagStartsWith(Entity, "stuff:")
	 */
	removeTagsStartsWith(entity, value) {
		const tags = entity.getTags();
		if (tags.length === 0) return null;
		tags.forEach((tag) => (tag.startsWith(value) ? entity.removeTag(tag) : ""));
	},
	/**
	 * Gets a players held item
	 * @param {Player} player player you want to get
	 * @returns {ItemStack}
	 * @example getHeldItem(Player);
	 */
	getHeldItem(player) {
		try {
			const inventory = player.getComponent("inventory").container;
			return inventory.getItem(player.selectedSlot);
		} catch (error) {}
	},

	/**
	 * Despawns a entity
	 * @param {Entity} entity entity to despawn
	 */
	despawn(entity) {
		entity.teleport({ x: 0, y: -64, z: 0 }, { dimension: world.overworld });
		entity.kill();
	},
	/**
	 * Finds a player by name or ID
	 * @param {string} name
	 * @return {Player | undefined}
	 */
	fetch(name) {
		for (const p of world.getPlayers()) {
			if (p.name === name || p.id === name) return p;
		}
	},
};
