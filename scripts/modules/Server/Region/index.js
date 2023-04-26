import {
	Entity,
	EntitySpawnAfterEvent,
	MinecraftBlockTypes,
	Player,
	system,
	world,
} from "@minecraft/server";
import { IS, XA } from "xapi.js";
import { Region, forEachItemAt } from "./Region.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "./config.js";

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
 * @param {EntitySpawnAfterEvent} data
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
world.beforeEvents.itemUseOn.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.block,
		data.source.dimension.type
	);
	if (allowed(data.source, region)) return;

	const block = data.source.dimension.getBlock(data.block);

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
		data.player.dimension.type
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
			player.dimension.type
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
	if (data.entity.typeId === "rubedo:database") return;
	const region = Region.blockLocationInRegion(
		data.entity.location,
		data.entity.dimension.type
	);
	if (spawnAllowed(region, data)) return;
	if (
		region &&
		(region.permissions.allowedEntitys.includes(data.entity.typeId) ||
			region.permissions.allowedEntitys === "all")
	)
		return;

	XA.Entity.despawn(data.entity);
});

system.runInterval(
	() => {
		if (!Region.CONFIG.PERMS_SETTED) return;
		const noPVPregions = Region.getAllRegions().filter(
			(e) => !e.permissions.pvp
		);

		for (const player of world.getAllPlayers()) {
			const {
				location,
				dimension: { type },
			} = player;

			if (
				noPVPregions.find(
					(e) => e.vectorInRegion(location) && e.dimensionId === type
				)
			)
				player.triggerEvent("player:spawn");
		}
	},
	"pvp region disable",
	20
);
