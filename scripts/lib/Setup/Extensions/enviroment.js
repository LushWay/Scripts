import { addMethod, editMethod } from "../patcher.js";
import { util } from "../utils.js";

/**
 * Common JavaScript objects
 *
 *
 */

addMethod(JSON, "safeParse", (str, reciever, onError) => {
	try {
		return JSON.parse(str, reciever);
	} catch (e) {
		onError(e);
	}
});

addMethod(Math, "randomInt", function (min, max) {
	return ~~(min + Math.random() * (max - min));
});

addMethod(Math, "randomFloat", function (min, max) {
	return min + Math.random() * (max - min);
});

addMethod(Array, "equals", function (one, two) {
	return one.every((e, i) => e === two[i]);
});

editMethod(console, "warn", ({ original, args }) => {
	original(...args.map((e) => (typeof e === "string" ? e : util.inspect(e))));
});

globalThis.nextTick = null;
