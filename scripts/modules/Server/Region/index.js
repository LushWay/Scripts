import {
	Entity,
	EntitySpawnAfterEvent,
	MinecraftBlockTypes,
	Player,
	system,
	world,
} from "@minecraft/server";
import { GameUtils, XEntity } from "xapi.js";
import { Region, forEachItemAt } from "./Region.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "./config.js";

let LOADED = false;

/**
 * @callback interactionAllowed
 * @param {Player | Entity} player
 * @param {Region} region
 */

/**
 * @callback spawnAllowed
 * @param {Region} region
 * @param {EntitySpawnAfterEvent} data
 */

/**
 * Loads regions with specified guards.
 * WARNING! Loads only one time
 * @param {interactionAllowed} allowed
 * @param {spawnAllowed} spawnAllowed
 */
export function loadRegionsWithGuards(allowed, spawnAllowed) {
	if (LOADED) throw new ReferenceError("Regions already loaded!");
	LOADED = true;

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
	world.afterEvents.blockPlace.subscribe((data) => {
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
	world.afterEvents.blockBreak.subscribe(
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

	world.afterEvents.entitySpawn.subscribe(({ entity }) => {
		const typeId = GameUtils.safeGetTypeID(entity);
		if (!typeId || typeId === "rubedo:database") return;
		const region = Region.blockLocationInRegion(
			entity.location,
			entity.dimension.type
		);
		if (spawnAllowed(region, { entity })) return;
		if (
			region &&
			(region.permissions.allowedEntitys.includes(typeId) ||
				region.permissions.allowedEntitys === "all")
		)
			return;

		XEntity.despawn(entity);
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
}
