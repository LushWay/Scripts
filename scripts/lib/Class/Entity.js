import { Container, Entity, ItemStack, Player, world } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";
import { DIMENSIONS } from "../List/dimensions.js";

/** @type {Database<string, IJoinData>} */
const DB = new Database("player");

/**
 * @author Smell of Curry, mrpatches123, mo9ses, xiller229 (Leaftail)
 */

export const XEntity = {
	/**
	 * Gets player name from player database with specific ID
	 * @param {string} ID
	 */
	getNameByID(ID) {
		return DB.get(`JOIN:${ID}`)?.name;
	},
	/**
	 * Checks if position is in radius
	 * @param {Vector3} center Center of radius
	 * @param {Vector3} pos Position to check
	 * @param {number} r Radius
	 * @returns {boolean}
	 */
	inRadius(center, pos, r) {
		const inRange = (
			/** @type {number} */ value,
			/** @type {number} */ center
		) => value <= r + center && value <= r - center;

		return (
			inRange(pos.x, center.x) &&
			inRange(pos.y, center.y) &&
			inRange(pos.z, center.z)
		);
	},
	/**
	 * Get entitie(s) at a position
	 * @param {{x: number, y: number, z: number}} p0 position of the entity
	 * @param {string} dimension Dimesion of the entity
	 * @returns {Array<Entity>}
	 * @example EntityBuilder.getEntityAtPos({0, 5, 0} 'nether');
	 */
	getAtPos({ x, y, z }, dimension = "overworld") {
		try {
			// @ts-expect-error
			return DIMENSIONS[dimension].getEntitiesAtBlockLocation({
				x: x,
				y: y,
				z: z,
			});
		} catch (error) {
			return [];
		}
	},
	/**
	 * Returns a location of the inputed aguments
	 * @param {{location: Vector3}} entity your using
	 * @param {number} [n] how many you want to get
	 * @param {number} [maxDistance] max distance away
	 * @param {string} [type] type of entity you want to get
	 * @returns {Array<Entity>}
	 * @example getClosetsEntitys(Entity, n=1, maxDistance = 10, type = Entity.type)
	 */
	getClosetsEntitys(entity, maxDistance = null, type, n = 2, shift = true) {
		/**
		 * @type {import("@minecraft/server").EntityQueryOptions}
		 */
		let q = {};
		q.location = entity.location;
		if (n) q.closest = n;
		if (type) q.type = type;

		if (maxDistance) q.maxDistance = maxDistance;
		let entitys = [...DIMENSIONS.overworld.getEntities(q)];
		if (shift) entitys.shift();
		return entitys;
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
	 * Get score of an entity
	 * @param {Entity} entity you want to test
	 * @param {string} objective Objective name you want to search
	 * @returns {number} 0
	 * @example getScore(Entity, 'Money');
	 */
	getScore(entity, objective) {
		try {
			return world.scoreboard
				.getObjective(objective)
				.getScore(entity.scoreboard);
		} catch (error) {
			return 0;
		}
	},
	/**
	 * Tests if a entity is dead
	 * @param {{hasComponent(s: string): boolean; getComponent(s: string): any}} entity entity you want to test
	 * @returns {boolean}
	 * @example isDead(Entity);
	 */
	isDead(entity) {
		return (
			entity.hasComponent("minecraft:health") &&
			entity.getComponent("minecraft:health").current <= 0
		);
	},
	/**
	 * Gets items count from inventory
	 * @param {Entity} entity entity from you want to get
	 * @param {string} id
	 * @returns {number}
	 */
	getItemsCount(entity, id) {
		const inventory = this.getI(entity);
		let count = 0;
		for (let i = 0; i < inventory.size; i++) {
			const item = inventory.getItem(i);
			if (!item) continue;
			if (item.typeId == id) count = count + item.amount;
		}
		return count;
	},
	/**
	 *
	 * @param {Player} entity
	 * @param {0 | "armor" | "armor.chest" | "armor.feet" | "armor.legs" | "slot.enderchest" | "weapon.mainhand" | "weapon.offhand"} location
	 * @param {string} [itemId]
	 * @returns
	 */
	async hasItem(entity, location, itemId) {
		let g = "";
		if (location) g += `location=slot.${location}`;
		if (itemId) g += `${location ? "," : ""}item=${itemId}`;
		try {
			const res = await entity.runCommandAsync(`testfor @s[hasitem={${g}}]`);
			if (res.successCount < 1) return false;

			return true;
		} catch (e) {
			return false;
		}
	},
	/**
	 * Gets the inventory of a entity
	 * @param {Entity} entity entity you want to get
	 * @returns {Container}
	 */
	getI(entity) {
		// @ts-ignore
		return entity.getComponent("minecraft:inventory").container;
	},
	/**
	 * Gets a players held item
	 * @param {Player} player player you want to get
	 * @returns {ItemStack}
	 * @example getHeldItem(Player);
	 */
	getHeldItem(player) {
		try {
			const inventory = XEntity.getI(player);
			return inventory.getItem(player.selectedSlot);
		} catch (error) {}
	},

	/**
	 * Despawns a entity
	 * @param {Entity} entity entity to despawn
	 */
	despawn(entity) {
		entity.teleport({ x: 0, y: -64, z: 0 }, DIMENSIONS.overworld, 0, 0);
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

