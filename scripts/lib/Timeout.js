import { system } from "@minecraft/server";
import { handle, ThrowError } from "../xapi.js";
import { benchmark } from "./Benchmark.js";

const AT = {};

/**
 * It runs a function after a certain amount of ticks
 * @param {number} ticks - The amount of ticks to wait before running the callback.
 * @param {Function} callback - The function to be called after the timeout.
 * @param {boolean} [loop] - Whether or not the timeout should loop.
 * @param {string | number} [id] - The id of the timeout.
 * @returns A function thats reset a timeout
 */
export function Timeout(ticks, callback, loop, id, n = true) {
	if (!id) {
		ThrowError(new ReferenceError("NO_TIMEOUT_ID"));
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
