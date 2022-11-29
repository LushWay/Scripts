import { BlockLocation, MinecraftBlockTypes, MinecraftDimensionTypes, Player, world } from "@minecraft/server";
import { sleep, XA } from "xapi.js";
import { ActionForm } from "../../../lib/Form/ActionForm.js";
import { CONFIG_MENU } from "../../Menu/var.js";
import { JOIN_EVENTS } from "../../OnJoin/events.js";
import { lang } from "./lang.js";
import { Region } from "../utils/Region.js";
import { findFreePlace } from "./utils.js";

const DB = new XA.instantDB(world, "buildRegion");

/**
 *
 * @param {Player} player
 */
async function CreateRegion(player, tp = true) {
	const place = await findFreePlace();

	const region = new Region(place.from, place.to, MinecraftDimensionTypes.overworld, {
		owners: [player.id],
		doorsAndSwitches: false,
		allowedEntitys: ["minecraft:player"],
		openContainers: false,
		pvp: false,
	});
	DB.set(player.id, region.key);
	const firstLoc = new BlockLocation(place.from.x, -55, place.from.z);
	const secondLoc = new BlockLocation(place.to.x, -55, place.to.z);
	await sleep(1);
	for (const loc of firstLoc.above().blocksBetween(secondLoc.above())) {
		XA.dimensions.overworld.getBlock(loc).setType(MinecraftBlockTypes.grass);
	}
	for (const loc of firstLoc.blocksBetween(secondLoc)) {
		XA.dimensions.overworld.getBlock(loc).setType(MinecraftBlockTypes.allow);
	}
	if (tp) player.teleport(firstLoc.above().above(), XA.dimensions.overworld, player.rotation.x, player.rotation.y);
	return region;
}

JOIN_EVENTS.playerGuide.subscribe((player) => {
	player.playSound("random.levelup");
	player.tell(lang.newPlayer);
	const oldRegion = DB.get(player.id);
	if (!oldRegion) CreateRegion(player);
});

CONFIG_MENU.menu = (player) => {
	const regionID = DB.get(player.id);
	let region = Region.getAllRegions().find((e) => e.key === regionID);
	if (!region) {
		player.tell("§cРегион был создан.");
		CreateRegion(player);
		return false;
	}
	const menu = new ActionForm("Меню площадки", lang.regionManageBody(region))
		.addButton("Переместиться", null, () => {})
		.addButton("§7Перейти на новую", null, () => {})
		.addButton("§cОчистить", null, () => {});
	return menu;
};
