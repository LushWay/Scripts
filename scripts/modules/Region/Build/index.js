import { Entity, MinecraftEffectTypes, Player, world } from "@minecraft/server";
import { IS, setPlayerInterval, setTickTimeout, XA } from "xapi.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "../utils/config.js";
import { Region } from "../utils/Region.js";
import "./menu.js";

const GLOBAL_ALLOWED_ENTITIES = ["minecraft:player", "f:t", "rubedo:database"];

/**
 *
 * @param {Player | Entity} player
 * @param {Region} region
 */
function allowed(player, region) {
	const is =
		IS(player.id, "builder") ||
		region?.permissions?.owners?.includes(player.id);
	return is;
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
	const l = data.block.location;
	data.dimension.runCommandAsync(`setblock ${l.x} ${l.y} ${l.z} air 0`);
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
		// setting chest inventory back
		// if (BLOCK_CONTAINERS.includes(brokenBlockPermutation.type.id)) {
		// 	const OLD_INVENTORY = CONTAINER_LOCATIONS[locationToKey(block.location)];
		// 	if (OLD_INVENTORY) {
		// 		OLD_INVENTORY.load(block.getComponent("inventory").container);
		// 	}
		// }
		// killing dropped items
		setTickTimeout(
			() => {
				[
					...dimension.getEntities({
						maxDistance: 2,
						type: "minecraft:item",
						location: block.location,
					}),
				].forEach((e) => e.kill());
			},
			0,
			"itemClear"
		);
	}
);

world.events.beforeExplosion.subscribe((data) => (data.cancel = true));
world.events.entitySpawn.subscribe((data) => {
	const region = Region.blockLocationInRegion(
		data.entity.location,
		data.entity.dimension.id
	);
	if (!region && GLOBAL_ALLOWED_ENTITIES.includes(data.entity.typeId)) return;
	if (region && region.permissions.allowedEntitys.includes(data.entity.typeId))
		return;

	XA.Entity.despawn(data.entity);
});

const EFFECT_Y = -53;
const TP_Y = -63;
const TP_TO = TP_Y + 5;

setPlayerInterval(
	(player) => {
		const loc = player.location;
		const rotation = player.getRotation();
		if (loc.y >= EFFECT_Y + 1) return;
		if (loc.y < EFFECT_Y)
			player.addEffect(MinecraftEffectTypes.levitation, 3, 7, false);
		if (loc.y < TP_Y)
			player.teleport(
				{ x: loc.x, y: TP_TO, z: loc.z },
				player.dimension,
				rotation.x,
				rotation.y
			);
	},
	0,
	"underground effects"
);
