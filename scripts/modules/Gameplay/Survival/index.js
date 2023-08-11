import { Vector } from "@minecraft/server";
import { EditableLocation } from "../../../xapi.js";
import { JOIN_CONFIG } from "../../Server/OnJoin/var.js";
import { Region } from "../../Server/Region/Region.js";
import { loadRegionsWithGuards } from "../../Server/Region/index.js";
import "./base.js";
import "./bouncyTnt.js";
import "./fireworks.js";
import { Portal } from "./portals.js";
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

function setup() {
	const AnarchyPortalLocation = new EditableLocation("anarchy");
	if (AnarchyPortalLocation.valid) {
		new Portal(
			"anarchy",
			Vector.add(AnarchyPortalLocation, { x: 0, y: -1, z: -1 }),
			Vector.add(AnarchyPortalLocation, { x: 0, y: 1, z: 1 }),
			(player) => {
				player.tell("§cВы типо телепортированы");
			}
		);
	}
}

setup();
