import { Player } from "@minecraft/server";
import { XA } from "../../../xapi.js";
import { Region } from "../utils/Region.js";

export const lang = {
	newPlayer: "Прив",
	/**
	 *
	 * @param {import("../utils/Region.js").Region} region
	 * @param {Player} player
	 * @returns
	 */
	regionManageBody: (region, player) => {
		let output = "";
		const add = (/** @type {string} */ t) => (output += `${t}\n`);

		const pos = XA.Entity.locationToBlockLocation(player.location);
		const current_region = Region.blockLocationInRegion(pos, player.dimension.id);

		if (current_region) {
			if (current_region.permissions.owners[0] !== region.permissions.owners[0]) {
				const name = XA.tables.player.get("NAME:" + current_region.permissions.owners[0]);
				add("§3Сейчас вы на квадрате игрока §f" + name);
			} else {
				add("§3Вы находитесь на своем квадрате");
			}
			add("");
		}

		add(`§3Координаты вашего квадрата: §c${region.from.x} §b${region.from.z}\n `);

		return output;
	},
};
