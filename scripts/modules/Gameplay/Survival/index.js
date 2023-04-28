import { JOIN_CONFIG } from "../../Server/OnJoin/var.js";
import { Region } from "../../Server/Region/Region.js";
import { setRegionGuards } from "../../Server/Region/index.js";
import "./base.js";
import "./raid.js";
import "./fireworks.js";
import "./bouncyTnt.js";

setRegionGuards(
	// Common actions guard
	(player, region) =>
		!region ||
		player.hasTag("modding") ||
		region.permissions.owners.includes(player.id),

	// Spawn entity guard
	(region, data) => !region
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
