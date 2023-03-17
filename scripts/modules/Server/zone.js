import { MolangVariableMap, Player, world } from "@minecraft/server";
import { setTickInterval, XA } from "../../xapi.js";
import { Atp } from "./portals.js";
import { global } from "./var.js";

const options = XA.WorldOptions("zone", {
	center: { desc: "", value: "0 0" },
});

/**
 *
 * @param {Player} player
 * @param {boolean} isX
 * @param {{x: number, z: number}} zone
 * @param {boolean} [plus]
 */
function ret(player, isX, zone, plus) {
	const loc = isX
		? [zone.x + (plus ? 1 : -1), player.location.y, player.location.z]
		: [player.location.x, player.location.y, zone.z + (plus ? 1 : -1)];

	player.teleport(
		{ x: loc[1], y: loc[2], z: loc[3] },
		player.dimension,
		player.rotation.x,
		player.rotation.y
	);
	player.onScreenDisplay.setActionBar(
		`§cОграничение мира до: §f${isX ? zone.x : zone.z}${isX ? "x" : "z"}`
	);
}
/**
 *
 * @param {Player} player
 * @param {boolean} isX
 * @param {{x: number, z: number}} zone
 */
function pret(player, isX, zone) {
	const floored = XA.Utils.floorVector(player.location);
	const l = isX
		? [zone.x, floored.y + 1, floored.z]
		: [floored.x, floored.y + 1, zone.z];

	const loc = { x: l[0], y: l[1], z: l[2] };

	player.dimension.spawnParticle(
		"minecraft:falling_border_dust_particle",
		loc,
		new MolangVariableMap()
	);
	player.dimension.spawnParticle(
		"minecraft:rising_border_dust_particle",
		loc,
		new MolangVariableMap()
	);
}

setTickInterval(
	() => {
		const players = world.getAllPlayers();
		global.Radius = 200 + 20 * players.length;
		const rad = global.Radius;
		const center = options.center.split(", ").map(Number);

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
			const l = XA.Utils.floorVector(p.location);

			const xtrue = inRange(l.x, rmin.x, rmax.x);
			const ztrue = inRange(l.z, rmin.z, rmax.z);

			if (xtrue && ztrue) {
				if (
					XA.Entity.getScore(p, "inv") !== 2 &&
					!p.hasTag("saving") &&
					!p.hasTag("br:ded")
				) {
					Atp(p, "anarch", { pvp: true });
				} else continue;
			}

			if (l.x >= rmax.x && l.x <= rmax.x + 10 && ztrue) ret(p, true, rmax);
			if (l.x >= rmax.x - 10 && l.x <= rmax.x && ztrue) pret(p, true, rmax);

			if (l.z >= rmax.z && l.z <= rmax.z + 10 && xtrue) ret(p, false, rmax);
			if (l.z >= rmax.z - 10 && l.z <= rmax.z && xtrue) pret(p, false, rmax);

			if (l.x <= rmin.x && l.x >= rmin.x - 10 && ztrue)
				ret(p, true, rmin, true);
			if (l.x <= rmin.x + 10 && l.x >= rmin.x && ztrue) pret(p, true, rmin);

			if (l.z <= rmin.z && l.z >= rmin.z - 10 && xtrue)
				ret(p, false, rmin, true);
			if (l.z <= rmin.z + 10 && l.z >= rmin.z && xtrue) pret(p, false, rmin);
		}
	},
	0,
	"zone"
);
