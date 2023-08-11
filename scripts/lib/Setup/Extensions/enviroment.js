import { OverTakes } from "../prototypes.js";
import { util } from "../utils.js";

/**
 * Common JavaScript objects
 *
 *
 */
OverTakes(JSON, {
	safeParse(str, reciever, onError) {
		try {
			return JSON.parse(str, reciever);
		} catch (e) {
			onError(e);
		}
	},
});

OverTakes(Math, {
	randomInt(min, max) {
		return ~~(min + Math.random() * (max - min));
	},
	randomFloat(min, max) {
		return min + Math.random() * (max - min);
	},
});

OverTakes(Array, {
	equals(one, two) {
		return one.every((e, i) => e === two[i]);
	},
});

Array.prototype.randomElement = function () {
	return this[~~(Math.random() * (this.length - 1))];
};

OverTakes(console, {
	error(...args) {
		super.error(
			args
				.map((e) =>
					util.toTerminalColors(typeof e === "string" ? e : util.inspect(e))
				)
				.join(" ")
		);
	},
	warn(...args) {
		super.warn(
			args
				.map((e) =>
					util.toTerminalColors(typeof e === "string" ? e : util.inspect(e))
				)
				.join(" ")
		);
	},
	log(...args) {
		super.log(
			args
				.map((e) =>
					util.toTerminalColors(typeof e === "string" ? e : util.inspect(e))
				)
				.join(" ")
		);
	},
});

globalThis.nextTick = null;
