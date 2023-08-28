import { System, world } from "@minecraft/server";
import { util } from "xapi.js";
import { OverTakes } from "../prototypes.js";

/**
 * @type {Record<string, string>}
 */
export const TIMERS_PATHES = {};

OverTakes(System.prototype, {
	sleep(time) {
		return new Promise((resolve) => super.runInterval(resolve, time));
	},
	runInterval(fn, name, ticks = 0) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = util.error.stack.get();
		TIMERS_PATHES[visual_id] = path;

		return super.runInterval(() => {
			const end = util.benchmark(visual_id, "timers");

			util.catch(fn, "Interval");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow interval (${took_ticks}/${ticks})  at:\n${path}`
				);
		}, ticks);
	},
	runTimeout(fn, name, ticks = 0) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = util.error.stack.get();
		TIMERS_PATHES[visual_id] = path;

		return super.runTimeout(() => {
			const end = util.benchmark(visual_id, "timers");

			util.catch(fn, "Timeout");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(
					`Found slow timeout (${took_ticks}/${ticks}) at:\n${path}`
				);
		}, ticks);
	},
	runPlayerInterval(fn, name, ticks = 0) {
		const visual_id = `${name} (loop ${ticks} ticks)`;
		const path = util.error.stack.get();
		TIMERS_PATHES[visual_id] = path;
		const forEach = () => {
			for (const player of world.getPlayers()) fn(player);
		};

		return super.runInterval(() => {
			const end = util.benchmark(visual_id, "timers");

			util.catch(forEach, "Player interval");

			const took_ticks = ~~(end() / 20);
			if (took_ticks > ticks)
				console.warn(`Found slow players interval at:\n${path}`);
		}, ticks);
	},
});
