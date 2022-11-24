import {
	BlockLocation,
	Entity,
	ItemStack,
	Location,
	Player,
	PlayerInventoryComponentContainer,
	world,
} from "@minecraft/server";

// Authots: Smell of curry, mrpatches

export const XEntity = {
	/**
	 * Checks if position is in radius
	 * @param {import("@minecraft/server").IVec3} center Center of radius
	 * @param {import("@minecraft/server").IVec3} pos Position to check
	 * @param {number} r Radius
	 * @returns {boolean}
	 */
	inRadius(center, pos, r) {
		const inR = (value, center) => value <= r + center && value <= r - center;

		return inR(pos.x, center.x) && inR(pos.y, center.y) && inR(pos.z, center.z);
	},
	/**
	 *
	 * @param {string} [type]
	 * @returns
	 */
	getEntitys(type) {
		const e = {};
		if (type) e.type = type;
		return world.getDimension("overworld").getEntities(e);
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
			return world.getDimension(dimension).getEntitiesAtBlockLocation(new BlockLocation(x, y, z));
		} catch (error) {
			return [];
		}
	},
	/**
	 * Returns a location of the inputed aguments
	 * @param {{location: Location}} entity your using
	 * @param {number} [n] how many you want to get
	 * @param {number} [maxDistance] max distance away
	 * @param {string} [type] type of entity you want to get
	 * @returns {Array<Entity>}
	 * @example getClosetsEntitys(Entity, n=1, maxDistance = 10, type = Entity.type)
	 */
	getClosetsEntitys(entity, maxDistance = null, type, n = 2, shift = true) {
		let q = {};
		q.location = entity.location;
		if (n) q.closest = n;
		if (type) q.type = type;

		if (maxDistance) q.maxDistance = maxDistance;
		let entitys = [...world.getDimension("overworld").getEntities(q)];
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
		const tag = tags.find((tag) => tag?.startsWith(value) && tag?.length > value.length);
		return tag ? tag.substring(value.length) : null;
	},
	/**
	 * Returns a location of the inputed aguments
	 * @param {Entity} entity your using
	 * @param {string} value what you want to search for
	 * @example getTagStartsWith(Entity, "stuff:")
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
			return world.scoreboard.getObjective(objective).getScore(entity.scoreboard);
		} catch (error) {
			return 0;
		}
	},
	/**
	 * Tests if a entity is dead
	 * @param {Entity} entity entity you want to test
	 * @returns {boolean}
	 * @example isDead(Entity);
	 */
	isDead(entity) {
		return (
			entity.hasComponent("minecraft:health") &&
			// @ts-ignore
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
	 * Gets the inventory of a entity
	 * @param {Entity} entity entity you want to get
	 * @returns {number}
	 */
	clearItems(entity, id, count) {
		const countt = entity.runCommand(`clear @s ${id} -1 ${count}`).statusMessage.split(": ")[1].replace(/\D/gi, "");
		return countt;
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
			await entity.runCommandAsync(`testfor @s[hasitem={${g}}]`);
			return true;
		} catch (e) {
			return false;
		}
	},
	/**
	 * Gets the inventory of a entity
	 * @param {Entity} entity entity you want to get
	 * @returns {PlayerInventoryComponentContainer}
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
	 * Converts a location to a block location
	 * @param {Location} loc a location to convert
	 * @returns {BlockLocation}
	 */
	locationToBlockLocation(loc) {
		return new BlockLocation(Math.floor(loc.x), Math.floor(loc.y), Math.floor(loc.z));
	},
	/**
	 * Despawns a entity
	 * @param {Entity} entity entity to despawn
	 */
	despawn(entity) {
		entity.teleport({ x: 0, y: -64, z: 0 }, entity.dimension, 0, 0);
		entity.kill();
	},
	/**
	 * Finds a player by name or ID
	 * @param {string} name
	 * @return {Player}
	 */
	fetch(name) {
		for (const p of world.getPlayers()) {
			if (p.name === name || p.id === name) return p;
		}
	},
};
