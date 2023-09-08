import { system, world } from "@minecraft/server";
import { is } from "xapi.js";
import { CONFIG } from "../../../config.js";
import { MinecraftEffectTypes } from "../../../lib/List/effects.js";
import { JOIN } from "../../Server/OnJoin/var.js";
import { Region } from "../../Server/Region/Region.js";
import { loadRegionsWithGuards } from "../../Server/Region/index.js";
import "./menu.js";

const GLOBAL_ALLOWED_ENTITIES = ["minecraft:player", "minecraft:item"].concat(
	CONFIG.system_entities,
);

loadRegionsWithGuards(
	// Common actions guard
	(player, region) =>
		is(player.id, "builder") || region?.permissions.owners.includes(player.id),

	// Spawn entity guard
	(region, data) =>
		!region && GLOBAL_ALLOWED_ENTITIES.includes(data.entity.typeId),
);

Region.CONFIG.PERMS_SETTED = true;
Region.CONFIG.PERMISSIONS.allowedEntitys = GLOBAL_ALLOWED_ENTITIES;
JOIN.CONFIG.title_animation = {
	stages: ["» $title «", "»  $title  «"],
	vars: {
		title: "§b§aShp1nat§bBuild§r§f",
	},
};
JOIN.CONFIG.subtitle = "Строим вместе!";

world.beforeEvents.explosion.subscribe((data) => (data.cancel = true));

const EFFECT_Y = -55;
const TP_Y = -63;
const TP_TO = TP_Y + 5;

system.runPlayerInterval((player) => {
	const loc = player.location;
	if (loc.y >= EFFECT_Y + 1) return;
	if (loc.y < EFFECT_Y)
		player.addEffect(MinecraftEffectTypes.Levitation, 3, {
			amplifier: 7,
			showParticles: false,
		});

	if (loc.y < TP_Y) player.teleport({ x: loc.x, y: TP_TO, z: loc.z });
}, "Server.type::Build('underground effects')");
