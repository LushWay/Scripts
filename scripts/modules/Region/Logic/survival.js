import {
	Player,
	Entity,
	world,
	Location,
	BlockLocation,
} from "@minecraft/server";
import { DIMENSIONS } from "../../../lib/Class/D.js";
import { setTickTimeout, XA, setTickInterval } from "xapi.js";
import { DOORS_SWITCHES, BLOCK_CONTAINERS } from "../config.js";
import { CONTAINER_LOCATIONS } from "../container.js";
import { Region } from "../Models/Region.js";
import { ScoreboardDB } from "../../../lib/Class/Options.js";

XA.Module.sync("InRaid", {});

/**
 * @type {Record<string, number>}
 */
const InRaid = XA.Module.get("InRaid");

const pvpDB = new ScoreboardDB("pvp");

setTickInterval(() => {
	for (const id in InRaid) {
		const player = XA.Entity.fetch(id);
		if (player) {
			if (pvpDB.Eget(player) === 0) {
				player.tell(
					"§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны."
				);
				player.playSound("mob.wolf.bark");
			}
			pvpDB.Eset(player, InRaid[id]);
			delete InRaid[id];
			continue;
		}

		InRaid[id]--;
		if (InRaid[id] <= 0) {
			// Время вышло, игрока не было
			delete InRaid[id];
			continue;
		}
	}
}, 20);

/**
 *
 * @param {Player | Entity} player
 * @param {Region} region
 */
function allowed(player, region) {
	return (
		region.permissions.owners.includes(player.id) || player.hasTag("modding")
	);
}

/**
 * Permissions for region
 */
world.events.beforeItemUseOn.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.blockLocation,
		data.source.dimension.id
	);
	if (!region || allowed(data.source, region)) return;
	const block = data.source.dimension.getBlock(data.blockLocation);









	if (
		DOORS_SWITCHES.includes(block.typeId) &&
		region.permissions.doorsAndSwitches
	)
		return;
	if (
		BLOCK_CONTAINERS.includes(block.typeId) &&
		region.permissions.openContainers
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
	if (!region || allowed(data.player, region)) return;
	const l = data.block.location;
	data.dimension.runCommandAsync(`setblock ${l.x} ${l.y} ${l.z} air 0 destroy`);
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
		if (!region || allowed(player, region)) return;
		// setting block back
		dimension
			.getBlock(block.location)
			.setPermutation(brokenBlockPermutation.clone());
		// setting chest inventory back
		if (BLOCK_CONTAINERS.includes(brokenBlockPermutation.type.id)) {
			const OLD_INVENTORY = CONTAINER_LOCATIONS[JSON.stringify(block.location)];
			if (OLD_INVENTORY) {
				OLD_INVENTORY.load(block.getComponent("inventory").container);
			}
		}
		// killing dropped items
		setTickTimeout(() => {
			[
				...dimension.getEntities({
					maxDistance: 2,
					type: "minecraft:item",
					location: new Location(
						block.location.x,
						block.location.y,
						block.location.z
					),
				}),
			].forEach((e) => e.kill());
		}, 0);
	}
);

world.events.beforeExplosion.subscribe((data) => {
	for (const bl of data.impactedBlocks) {
		let region = Region.blockLocationInRegion(bl, data.dimension.id);
		if (region && !region.permissions.pvp) return (data.cancel = true);
		for (const id of region.permissions.owners) XA.Module.InRaid[id] = 60;
	}
});
world.events.entityCreate.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		new BlockLocation(
			data.entity.location.x,
			data.entity.location.y,
			data.entity.location.z
		),
		data.entity.dimension.id
	);
	if (!region) return;
	if (region.permissions.allowedEntitys.includes(data.entity.typeId)) return;
	data.entity.teleport({ x: 0, y: -64, z: 0 }, data.entity.dimension, 0, 0);
	data.entity.kill();
});
setTickInterval(() => {
	for (const region of Region.getAllRegions()) {
		for (const entity of DIMENSIONS[region.dimensionId].getEntities({
			excludeTypes: region.permissions.allowedEntitys,
		})) {
			if (!region.entityInRegion(entity)) continue;
			entity.teleport({ x: 0, y: -64, z: 0 }, entity.dimension, 0, 0);
			entity.kill();
		}
	}
}, 100);
