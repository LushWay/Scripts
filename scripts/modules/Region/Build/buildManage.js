import { Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { XA } from "xapi.js";
import { lang } from "../utils/lang.js";
import { Region } from "../utils/Region.js";
import { findFreePlace } from "./utils.js";

const db = new XA.instantDB(world, "buildRegion");

/**
 *
 * @param {Player} player
 */
async function CreateRegion(player) {
	const place = await findFreePlace();
	new Region(place.from, place.to, "overworld", {
		owners: [player.id],
		doorsAndSwitches: false,
		allowedEntitys: ["minecraft:player"],
		openContainers: false,
		pvp: false,
	});
}

world.events.playerJoin.subscribe((data) => {
	const player = data.player;
	if (!db.has(player.id)) {
		player.tell(lang.newPlayer);
		CreateRegion(player);
	}
});

const gui = "xa:menu";

const menu = (/** @type {Player} */ player) => {
	const a = new ActionFormData()
		.title("Меню")
		.button("Спавн")
		.button("Анархия")
		.button("Миниигры")
		.button("Статистика");

	return a;
};

world.events.beforeItemUse.subscribe(async (d) => {
	if (d.item.typeId !== gui || !(d.source instanceof Player)) return;
	menu(d.source).show(d.source);
});
