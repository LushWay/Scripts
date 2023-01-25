import { Player, world } from "@minecraft/server";
import { Timeout } from "../XTimeout.js";

/**
 *
 * @param {(plr: Player) => void} callback
 */
export function forPlayers(callback) {
	for (const player of world.getPlayers()) if (typeof callback === "function") callback(player);
}

/**
 * Returns a promise that will be resolved after given time
 * @param {number} time time in ticks
 * @returns {Promise<void>}
 */
export const sleep = (time) => new Promise((resolve) => setTickTimeout(() => resolve(), time, "sleep"));

/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickInterval(callback, ticks = 0, name) {
	return Timeout(ticks, callback, true, name);
}

/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickTimeout(callback, ticks = 1, name) {
	return Timeout(ticks, callback, false, name ?? Date.now());
}

/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerInterval(callback, ticks = 0, name) {
	return Timeout(ticks, () => forPlayers(callback), true, name);
}

/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerTimeout(callback, ticks = 1, name) {
	return Timeout(ticks, () => forPlayers(callback), false, name ?? Date.now());
}
