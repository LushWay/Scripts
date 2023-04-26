import { system, world } from "@minecraft/server";
import { PVP } from "../Indicator/var.js";
import { RaidNotify } from "./var.js";
import { Region } from "../../Server/Region/Region.js";

world.beforeEvents.explosion.subscribe((data) => {
	for (const bl of data.getImpactedBlocks()) {
		let region = Region.blockLocationInRegion(bl, data.dimension.type);
		if (region && !region.permissions.pvp) return (data.cancel = true);
		for (const id of region.permissions.owners) RaidNotify[id] = 60;
	}
});

system.runInterval(
	() => {
		for (const id in RaidNotify) {
			// Ищем игрока...
			const player = XA.Entity.fetch(id);
			if (player) {
				if (PVP.get(player) === 0) {
					player.tell(
						"§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны."
					);
					player.playSound("mob.wolf.bark");
				}
				PVP.set(player, RaidNotify[id]);
				delete RaidNotify[id];
				continue;
			}

			RaidNotify[id]--;
			if (RaidNotify[id] <= 0) {
				// Время вышло, игрока не было
				delete RaidNotify[id];
				continue;
			}
		}
	},
	"raid notify",
	20
);
