import { Player, Vector, system, world } from "@minecraft/server";
import { XA } from "xapi.js";
import { SERVER } from "../../Server/Server/var.js";

const options = XA.WorldOptions("server", {
	zone_center: { desc: "", value: "0 0", name: "Центр зоны" },
});

/**
 *
 * @param {Player} player
 * @param {boolean} isX
 * @param {{x: number, z: number}} zone
 * @param {boolean} [plus]
 */
function zone(player, isX, zone, plus) {
	const loc = isX
		? [zone.x + (plus ? 1 : -1), player.location.y, player.location.z]
		: [player.location.x, player.location.y, zone.z + (plus ? 1 : -1)];

	player.teleport({ x: loc[1], y: loc[2], z: loc[3] });
	player.onScreenDisplay.setActionBar(
		`§cОграничение мира до: §f${isX ? zone.x : zone.z}${isX ? "x" : "z"}`
	);
}

system.runInterval(
	() => {
		const players = world.getAllPlayers();
		SERVER.radius = 200 + 20 * players.length;
		const rad = SERVER.radius;
		const center = options.zone_center.split(", ").map(Number);

		/**
		 *
		 * @param {number} value
		 * @param {number} min
		 * @param {number} max
		 * @returns
		 */
		const inRange = (value, min, max) => value <= max && value >= min;

		for (const p of players) {
			const rmax = { x: center[0] + rad, z: center[1] + rad };
			const rmin = { x: center[0] - rad, z: center[1] - rad };
			const { x, z } = Vector.floor(p.location);

			const xtrue = inRange(x, rmin.x, rmax.x);
			const ztrue = inRange(z, rmin.z, rmax.z);

			if (x >= rmax.x && x <= rmax.x + 10 && ztrue) zone(p, true, rmax);
			if (z >= rmax.z && z <= rmax.z + 10 && xtrue) zone(p, false, rmax);
			if (x <= rmin.x && x >= rmin.x - 10 && ztrue) zone(p, true, rmin, true);
			if (z <= rmin.z && z >= rmin.z - 10 && xtrue) zone(p, false, rmin, true);
		}
	},
	"zone",
	0
);
