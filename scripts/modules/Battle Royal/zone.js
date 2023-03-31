import { MolangVariableMap, Player } from "@minecraft/server";
import { XA } from "xapi.js";

export class zone {
	/**
	 * It's a function that teleports the player to the edge of the zone.
	 * @param {Player} player
	 * @param {boolean} isX
	 * @param {Vector3} zone
	 * @param {boolean} [plus]
	 */
	static ret(player, isX, zone, plus) {
		const a = isX
			? `${plus ? zone.x + 1 : zone.x - 1} ${player.location.y} ${
					player.location.z
			  }`
			: `${player.location.x} ${player.location.y} ${
					plus ? zone.z + 1 : zone.z - 1
			  }`;

		XA.runCommandX(`damage "${player.name}" 1 void`);
		XA.runCommandX(`tp "${player.name}" ${a}`);
		player.onScreenDisplay.setActionBar("§cЗона!");
	}
	/**
	 *
	 * @param {Player} player
	 * @param {boolean} isX
	 * @param {Vector3} zone
	 */
	static pret(player, isX, zone) {
		const floored = Vector.floor(player.location);
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
}

