import { Player, world } from "@minecraft/server";
import { system } from "@minecraft/server";
import { DisplayError, handle } from "../../xapi.js";
import { benchmark } from "../XBenchmark.js";

// Active timers
const AT = {};

/**
 * It runs a function after a certain amount of ticks
 * @param {number} ticks - The amount of ticks to wait before running the callback.
 * @param {Function} callback - The function to be called after the timeout.
 * @param {boolean} [loop] - Whether or not the timeout should loop.
 * @param {string | number} [id] - The id of the timeout.
 * @returns A function thats reset a timeout
 */
function Timeout(ticks, callback, loop, id, n = true) {
	if (!id) {
		DisplayError(new ReferenceError("NO_TIMEOUT_ID"));
		id = Date.now();
	}
	if (!(id in AT) || n) AT[id] = 0;

	AT[id]++;

	if (AT[id] >= ticks) {
		AT[id] = 0;
		const end = benchmark(`${id} (${loop ? "loop " : ""}${ticks} ticks)`);
		handle(callback, "Timeout");
		const took_ticks = ~~(end() / 20);
		if (took_ticks > ticks) console.warn(callback.toString());
		if (!loop) return;
	}

	if (AT[id] >= 0) system.run(() => Timeout(ticks, callback, loop, id, false));

	const stop = () => {
		AT[id] = -10;
	};
	return stop;
}

/**
 *
 * @param {(plr: Player) => void} callback
 */
function forPlayers(callback) {
	for (const player of world.getPlayers()) callback(player);
}

/**
 * Returns a promise that will be resolved after given time
 * @param {number} time time in ticks
 * @returns {Promise<void>}
 */
export const sleep = (time) =>
	new Promise((resolve) => setTickTimeout(() => resolve(), time, "sleep"));

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
