import { BlockLocation, Location, MolangVariableMap, Player } from "@minecraft/server";
import { XA } from "xapi.js";

export class zone {
	/**
	 *
	 * @param {Player} player
	 * @param {boolean} isX
	 * @param {BlockLocation} zone
	 * @param {boolean} [plus]
	 */
	static ret(player, isX, zone, plus) {
		const a = isX
			? `${plus ? zone.x + 1 : zone.x - 1} ${player.location.y} ${player.location.z}`
			: `${player.location.x} ${player.location.y} ${plus ? zone.z + 1 : zone.z - 1}`;

		XA.runCommand(`damage "${player.name}" 1 void`);
		XA.runCommand(`tp "${player.name}" ${a}`);
		player.onScreenDisplay.setActionBar("§cЗона!");
	}
	/**
	 *
	 * @param {Player} player
	 * @param {boolean} isX
	 * @param {BlockLocation} zone
	 */
	static pret(player, isX, zone) {
		const floored = XA.Entity.locationToBlockLocation(player.location);
		const l = isX ? [zone.x, floored.y + 1, floored.z] : [floored.x, floored.y + 1, zone.z];

		const loc = new Location(l[0], l[1], l[2]);

		player.dimension.spawnParticle("minecraft:falling_border_dust_particle", loc, new MolangVariableMap());
		player.dimension.spawnParticle("minecraft:rising_border_dust_particle", loc, new MolangVariableMap());
	}
}
