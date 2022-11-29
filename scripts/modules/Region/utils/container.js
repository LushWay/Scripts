import { Location, world } from "@minecraft/server";
import { setTickInterval, sleep, XA } from "xapi.js";

import { BlockInventory } from "./BlockInventory.js";
import { BLOCK_CONTAINERS, CHECK_SIZE } from "./config.js";

/**
 *
 * @param {import("@minecraft/server").IVec3} location
 */
export function locationToKey(location) {
	return `${location.x} ${location.y} ${location.z}`;
}

/**
 * storage of all container locations in the world
 * @type {Record<string, BlockInventory>}
 */
export let CONTAINER_LOCATIONS = {};

setTickInterval(async () => {
	CONTAINER_LOCATIONS = {};
	for (const player of world.getPlayers()) {
		const blockLoc = XA.Entity.locationToBlockLocation(player.location);
		const pos1 = blockLoc.offset(CHECK_SIZE.x, CHECK_SIZE.y, CHECK_SIZE.z);
		const pos2 = blockLoc.offset(-CHECK_SIZE.x, -CHECK_SIZE.y, -CHECK_SIZE.z);

		for (const location of pos1.blocksBetween(pos2)) {
			if (location.y < -64) continue;
			const block = player.dimension.getBlock(location);
			if (!BLOCK_CONTAINERS.includes(block.typeId)) continue;
			CONTAINER_LOCATIONS[locationToKey(location)] = new BlockInventory(block.getComponent("inventory").container);
		}
	}
}, 40);
