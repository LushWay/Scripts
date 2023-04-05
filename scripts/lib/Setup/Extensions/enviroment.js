import { addMethod, editMethod } from "../patcher.js";
import { toStr } from "../utils.js";

/**
 * Common JavaScript objects
 *
 *
 */

addMethod(Function.prototype, "typedBind", function (context) {
	return this.bind(context);
});

addMethod(JSON, "safeParse", (str, reciever, onError) => {
	try {
		return JSON.parse(str, reciever);
	} catch (e) {
		onError(e);
	}
});

addMethod(Array, "equals", function (one, two) {
	return one.every((e, i) => e === two[i]);
});

editMethod(console, "warn", ({ original, args }) => {
	original(...args.map((e) => (typeof e === "string" ? e : toStr(e))));
});

globalThis.nextTick = null;

/**
 *
 *
 */

import { ItemUseOnEvent } from "@minecraft/server";

/**
 * ItemUseOnEvent
 *
 *
 *
 */

Reflect.defineProperty(ItemUseOnEvent.prototype, "blockLocation", {
	get() {
		this.location ??= this.getBlockLocation();
		return this.location;
	},
	configurable: false,
	enumerable: true,
});
