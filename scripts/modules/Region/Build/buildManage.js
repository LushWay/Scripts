import { Player, world } from "@minecraft/server";
import { XA } from "xapi.js";
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
async function CreateRegion(player) {
	const place = await findFreePlace();

	const region = new Region(place.from, place.to, "overworld", {
		owners: [player.id],
		doorsAndSwitches: false,
		allowedEntitys: ["minecraft:player"],
		openContainers: false,
		pvp: false,
	});
	DB.set(player.id, region.key);
}

JOIN_EVENTS.playerGuide.subscribe((player) => {
	player.playSound("random.levelup");
	player.tell(lang.newPlayer);
	const oldRegion = DB.get(player.id);
	if (!oldRegion) CreateRegion(player);
});

CONFIG_MENU.menu = (player) => {
	const regionID = DB.get(player.id);
	const region = Region.getAllRegions().find((e) => e.key === regionID);
	if (!region) {
		player.tell("§cНет региона!");
		return false;
	}
	const menu = new ActionForm(lang.regionManageTitle, lang.regionManageBody(region))
		.addButton("Переместиться", null, () => {})
		.addButton("§7Перейти на новую", null, () => {})
		.addButton("§cОчистить", null, () => {});
	return menu;
};
