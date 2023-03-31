import {
	Entity,
	EntitySpawnEvent,
	MinecraftBlockTypes,
	Player,
	world,
} from "@minecraft/server";
import { IS, XA } from "xapi.js";
import { Region, forEachItemAt } from "../utils/Region.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "../utils/config.js";

/**
 *
 * @param {Player | Entity} player
 * @param {Region} region
 */
let allowed = (player, region) => {
	const is =
		IS(player.id, "builder") ||
		region?.permissions?.owners?.includes(player.id);

	return is;
};

/**
 *
 * @param {Region} region
 * @param { EntitySpawnEvent} data
 */
let spawnAllowed = (region, data) => !region;

/**
 *
 * @param {typeof allowed} allowFN
 * @param {typeof spawnAllowed} spawnFN
 */
export function setRegionGuards(allowFN, spawnFN) {
	allowed = allowFN;
	spawnAllowed = spawnFN;
}

/**
 * Permissions for region
 */
world.events.beforeItemUseOn.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.blockLocation,
		data.source.dimension.id
	);
	if (allowed(data.source, region)) return;

	const block = data.source.dimension.getBlock(data.blockLocation);

	if (
		DOORS_SWITCHES.includes(block.typeId) &&
		region?.permissions?.doorsAndSwitches
	)
		return;

	if (
		BLOCK_CONTAINERS.includes(block.typeId) &&
		region?.permissions?.openContainers
	)
		return;

	data.cancel = true;
});

/**
 * Permissions for region
 */
world.events.blockPlace.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.block.location,
		data.player.dimension.id
	);
	if (allowed(data.player, region)) return;

	data.block.setType(MinecraftBlockTypes.air);
});

/**
 * Permissions for region
 */
world.events.blockBreak.subscribe(
	({ player, block, brokenBlockPermutation, dimension }) => {
		const region = Region.blockLocationInRegion(
			block.location,
			player.dimension.id
		);

		if (allowed(player, region)) return;

		// setting block back
		dimension
			.getBlock(block.location)
			.setPermutation(brokenBlockPermutation.clone());

		if (BLOCK_CONTAINERS.includes(brokenBlockPermutation.type.id)) {
			block.setPermutation(brokenBlockPermutation);

			// setting chest inventory back
			const { container } = block.getComponent("inventory");
			forEachItemAt(dimension, block.location, (e) => {
				container.addItem(e.getComponent("item").itemStack);
				e.kill();
			});
		} else forEachItemAt(dimension, block.location);
	}
);

world.events.entitySpawn.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.entity.location,
		data.entity.dimension.id
	);
	if (spawnAllowed(region, data)) return;
	if (region && region.permissions.allowedEntitys.includes(data.entity.typeId))
		return;

	XA.Entity.despawn(data.entity);
});
