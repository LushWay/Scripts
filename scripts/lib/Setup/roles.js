import { Player, world } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";

/** @type {Database<string, {role: keyof typeof ROLES}>} */
const table = Database.eventProxy(new Database("player"), {
	beforeGet(key, value) {
		value ??= { role: "member" };
		value.role ??= "member";
		return value;
	},
	beforeSet(key, value) {
		if (value.role === "member") delete value.role;
		return value;
	},
});

/**
 * The roles that are in this server
 */
export const ROLES = {
	member: 0,
	admin: 1,
	moderator: 2,
	builder: 3,
};

/** @type {Record<keyof typeof ROLES, string>}} */
export const ROLES_NAMES = {
	admin: "§cАдмин",
	builder: "§3Строитель",
	member: "§fУчастник",
	moderator: "§5Модератор",
};

/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {keyof typeof ROLES}
 * @example getRole("23529890")
 */
export function getRole(playerID) {
	world.debug(table._);

	if (playerID instanceof Player) playerID = playerID.id;

	const role = table.get(playerID).role;

	if (!Object.keys(ROLES).includes(role)) return "member";
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
	if (player instanceof Player) player = player.id;
	const { data, save } = table.work(player);
	data.role = role;
	save();
}

/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {keyof typeof ROLES} role
 */
export function IS(playerID, role) {
	/** @type {(keyof typeof ROLES)[]} */
	let arr = ["moderator", "admin"];

	if (role === "admin") arr = ["admin"];
	if (role === "builder") arr.push("builder");

	return arr.includes(getRole(playerID));
}
