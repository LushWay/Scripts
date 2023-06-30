import { addMethod, editMethod } from "../patcher.js";
import { util } from "../utils.js";
import { EntityHealthComponent } from "@minecraft/server"

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

addMethod(Array.prototype, "randomElement", function () {
	return this[~~(Math.random() * (this.length - 1))];
});

editMethod(console, "warn", ({ original, args }) => {
	original(...args.map((e) => (typeof e === "string" ? e : util.inspect(e))));
});

globalThis.nextTick = null;

/**
 * 
 * Polyfills
 * 
 * 
 */
 
if (!("defaultValue" in EntityHealthComponent.prototype)) Object.defineProperties(EntityHealthComponent.prototype, {
  defaultValue: {
    get() {
			return this.default
		},
		configurable: false,
		enumerable: true,
  },
  currentValue: {
    get() {
			return this.current
		},
		configurable: false,
		enumerable: true,
  },
  setCurrentValue: {
    value(v) {
      this.current = v
    },
		configurable: false,
		enumerable: true,
  }
});