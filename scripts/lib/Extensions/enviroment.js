import { util } from "../util.js";
import { OverTakes } from "./import.js";

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
			onError && onError(e);
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

/**
 *
 * @param  {any[]} args
 */
function format(args) {
	return args
		.map((e) =>
			util.toTerminalColors(typeof e === "string" ? e : util.inspect(e)),
		)
		.join(" ");
}

OverTakes(console, {
	error(...args) {
		super.error(format(args));
	},
	warn(...args) {
		super.warn(format(args));
	},
	log(...args) {
		super.log(format(args));
	},
	debug(...args) {
		super.log(format(args));
	},
	verbose(...args) {
		if (globalThis.verbose) super.log(format(args));
	},
});

// @ts-expect-error
globalThis.nextTick = null;
globalThis.verbose = false;
