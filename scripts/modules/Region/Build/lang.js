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
		}

		add(`§fКоординаты вашей площадки: §c${region.from.x} §b${region.from.z}§f\n`);

		return output;
	},
};
