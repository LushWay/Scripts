import { world } from "@minecraft/server";
import { setRegionGuards } from "../Default/index.js";
import { Region } from "../utils/Region.js";
import { InRaid } from "../var.js";

world.events.beforeExplosion.subscribe((data) => {
	for (const bl of data.getImpactedBlocks()) {
		let region = Region.blockLocationInRegion(bl, data.dimension.id);
		if (region && !region.permissions.pvp) return (data.cancel = true);
		for (const id of region.permissions.owners) InRaid[id] = 60;
	}
});

setRegionGuards(
	// Common actions guard
	(player, region) =>
		!region ||
		player.hasTag("modding") ||
		region.permissions.owners.includes(player.id),

	// Spawn entity guard
	(region, data) => !region
);

