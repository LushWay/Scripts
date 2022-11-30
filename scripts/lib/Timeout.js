import { system } from "@minecraft/server";
import { handler, ThrowError } from "../xapi.js";
import { benchmark } from "./Benchmark.js";

const AT = {};

/**
 * @param {number} ticks
 * @param {Function} callback
 * @param {boolean} [loop]
 * @param {string | number} [id]
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
		const end = benchmark(id + "");
		handler(callback, "Timeout");
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
