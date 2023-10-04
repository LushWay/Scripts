import { Player, system } from "@minecraft/server";
import { WorldDynamicPropertiesKey } from "lib/Database/Properties.js";
console.log("imported");
/** @type {WorldDynamicPropertiesKey<string, {role?: keyof typeof ROLES} | undefined>} */
const db = new WorldDynamicPropertiesKey("player", {
	defaultValue() {
		return { role: "member" };
	},
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
	if (event.id === "ROLE:ADMIN") {
		const player = Player.fetch(event.message);
		if (!player)
			return console.warn("(SCRIPTEVENT::ROLE:ADMIN) PLAYER NOT FOUND");

		setRole(player, "admin");
		console.warn("(SCRIPTEVENT::ROLE:ADMIN) ROLE HAS BEEN SET");
	}
});

const table = db.proxy();

/**
 * The roles that are in this server
 */
export const ROLES = {
	admin: "§cАдмин",
	moderator: "§5Модератор",
	builder: "§3Строитель",
	member: "§fУчастник",
};

/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {keyof typeof ROLES}
 * @example getRole("23529890")
 */
export function getRole(playerID) {
	return "admin";

	if (playerID instanceof Player) playerID = playerID.id;

	const role = table[playerID]?.role;

	if (!role || !Object.keys(ROLES).includes(role)) return "member";
	return role;
}

/**
 * Sets the role of this player
 * @example setRole("342423452", "admin")
 * @param {Player | string} player
 * @param {keyof typeof ROLES} role
 * @returns {void}
 */
export function setRole(player, role) {
	return;

	if (player instanceof Player) player = player.id;
	table[player] ??= {};
	const obj = table[player];
	if (obj) obj.role = role;
}

/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {keyof typeof ROLES} role
 */
export function is(playerID, role) {
	/** @type {(keyof typeof ROLES)[]} */
	let arr = ["moderator", "admin"];

	if (role === "member") return true;
	if (role === "builder") arr.push("builder");
	if (role === "admin") arr = ["admin"];

	return arr.includes(getRole(playerID));
}
