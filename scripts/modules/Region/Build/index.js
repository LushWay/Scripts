import { MinecraftEffectTypes, system, world } from "@minecraft/server";
import { IS } from "xapi.js";
import { setRegionGuards } from "../Default/index.js";
import "./menu.js";

const GLOBAL_ALLOWED_ENTITIES = ["minecraft:player", "f:t", "rubedo:database"];

setRegionGuards(
	// Common actions guard
	(player, region) =>
		IS(player.id, "builder") ||
		region?.permissions?.owners?.includes(player.id),

	// Spawn entity guard
	(region, data) =>
		!region && GLOBAL_ALLOWED_ENTITIES.includes(data.entity.typeId)
);

world.events.beforeExplosion.subscribe((data) => (data.cancel = true));

const EFFECT_Y = -53;
const TP_Y = -63;
const TP_TO = TP_Y + 5;

system.runPlayerInterval((player) => {
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
}, "underground effects");
