import { System, system, world } from "@minecraft/server";
import { handle } from "../../xapi.js";
import { stackParse } from "../Class/XError.js";
import { benchmark } from "../XBenchmark.js";
import { addMethod, editMethod } from "./patcher.js";

/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {};

addMethod(
	System.prototype,
	"sleep",
	(time) => new Promise((resolve) => system.runInterval(resolve, "sleep", time))
);

const originalInterval = System.prototype.runInterval.bind(system);
editMethod(
	System.prototype,
	"runInterval",
	function ({ original, args: [fn, name, ticks] }) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = stackParse();
		TIMERS_PATHES[visual_id] = path;

		return original(() => {
			const end = benchmark(visual_id, "timers");

			handle(fn, "Interval");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow interval (${took_ticks}/${ticks})  at:\n${path}`
				);
			// @ts-expect-error
		}, ticks);
	}
);

editMethod(
	System.prototype,
	"runTimeout",
	function ({ original, args: [fn, name, ticks] }) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = stackParse();
		TIMERS_PATHES[visual_id] = path;

		return original(() => {
			const end = benchmark(visual_id, "timers");

			handle(fn, "Timeout");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow timeout (${took_ticks}/${ticks}) at:\n${path}`
				);
			// @ts-expect-error
		}, ticks);
	}
);

addMethod(System.prototype, "runPlayerInterval", function (fn, name, ticks) {
	const visual_id = `${name} (loop ${ticks} ticks)`;
	const path = stackParse();
	TIMERS_PATHES[visual_id] = path;
	const forEach = () => {
		for (const player of world.getPlayers()) fn(player);
	};

	return originalInterval(() => {
		const end = benchmark(visual_id, "timers");

		handle(forEach, "Player interval");

		const took_ticks = ~~(end() / 20);
		if (took_ticks > ticks)
			console.warn(`Found slow players interval at:\n${path}`);
	}, ticks);
});

