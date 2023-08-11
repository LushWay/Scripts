import { System, world } from "@minecraft/server";
import { util } from "xapi.js";
import { benchmark } from "../../Class/Benchmark.js";
import { stackParse } from "../../Class/Error.js";
import { OverTakes } from "../prototypes.js";

/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {};

OverTakes(System.prototype, {
	sleep(time) {
		return new Promise((resolve) => super.runInterval(resolve, "sleep", time));
	},
	runInterval(fn, name, ticks) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = stackParse();
		TIMERS_PATHES[visual_id] = path;

		return super.runInterval(() => {
			const end = benchmark(visual_id, "timers");

			util.handle(fn, "Interval");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow interval (${took_ticks}/${ticks})  at:\n${path}`
				);
		}, ticks);
	},
	runTimeout(fn, name, ticks) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = stackParse();
		TIMERS_PATHES[visual_id] = path;

		return super.runTimeout(() => {
			const end = benchmark(visual_id, "timers");

			util.handle(fn, "Timeout");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow timeout (${took_ticks}/${ticks}) at:\n${path}`
				);
		}, ticks);
	},
	runPlayerInterval(fn, name, ticks) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = stackParse();
		TIMERS_PATHES[visual_id] = path;
		const forEach = () => {
			for (const player of world.getPlayers()) fn(player);
		};

		return super.runInterval(() => {
			const end = benchmark(visual_id, "timers");

			util.handle(forEach, "Player interval");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(`Found slow players interval at:\n${path}`);
		}, ticks);
	},
});
