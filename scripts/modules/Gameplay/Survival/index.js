import { JOIN_CONFIG } from "../../Server/OnJoin/var.js";
import { Region } from "../../Server/Region/Region.js";
import { loadRegionsWithGuards } from "../../Server/Region/index.js";
import "./base.js";
import "./bouncyTnt.js";
import "./fireworks.js";
import "./raid.js";

loadRegionsWithGuards(
	// Common actions guard
	(player, region) =>
		(region && region.permissions.owners.includes(player.id)) ||
		player.hasTag("modding"),

	// Spawn entity guard
	(region, data) =>
		!region ||
		region.permissions.allowedEntitys === "all" ||
		region.permissions.allowedEntitys.includes(data.entity.typeId)
);

Region.CONFIG.PERMISSIONS = {
	allowedEntitys: "all",
	doorsAndSwitches: false,
	openContainers: false,
	owners: [],
	pvp: true,
};

JOIN_CONFIG.title_animation = {
	stages: ["» $title «", "»  $title  «"],
	vars: {
		title: "§aShp1nat§6Mine§r§f",
	},
};
JOIN_CONFIG.subtitle = "Добро пожаловать!";
