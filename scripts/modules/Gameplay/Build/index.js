import { MinecraftEffectTypes, system, world } from "@minecraft/server";
import { IS } from "xapi.js";
import { JOIN_CONFIG } from "../../Server/OnJoin/var.js";
import { Region } from "../../Server/Region/Region.js";
import { setRegionGuards } from "../../Server/Region/index.js";
import "./menu.js";
import { CONFIG } from "../../../config.js";

const GLOBAL_ALLOWED_ENTITIES = ["minecraft:player", "minecraft:item"].concat(
	CONFIG.system_entities
);

setRegionGuards(
	// Common actions guard
	(player, region) =>
		IS(player.id, "builder") || region.permissions.owners.includes(player.id),

	// Spawn entity guard
	(region, data) =>
		!region && GLOBAL_ALLOWED_ENTITIES.includes(data.entity.typeId)
);

Region.CONFIG.PERMISSIONS.allowedEntitys = GLOBAL_ALLOWED_ENTITIES;
JOIN_CONFIG.title_animation = {
	stages: ["» $title «", "»  $title  «"],
	vars: {
		title: "§b§lBuild§r§f",
	},
};
JOIN_CONFIG.subtitle = "Строим вместе!";

world.beforeEvents.explosion.subscribe((data) => (data.cancel = true));

const EFFECT_Y = -53;
const TP_Y = -63;
const TP_TO = TP_Y + 5;

system.runPlayerInterval((player) => {
	const loc = player.location;
	if (loc.y >= EFFECT_Y + 1) return;
	if (loc.y < EFFECT_Y)
		player.addEffect(MinecraftEffectTypes.levitation, 3, {
			amplifier: 7,
			showParticles: false,
		});

	if (loc.y < TP_Y) player.teleport({ x: loc.x, y: TP_TO, z: loc.z });
}, "Server.type::Build('underground effects')");
