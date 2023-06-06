import { system, world } from "@minecraft/server";
import { util } from "./utils.js";

var WORLD_IS_LOADED = false;

/** @type {Function[]} */
var ON_LOAD_CALLBACKS = [];

var ON_LOAD_PROMISE = new Promise((resolve) =>
	system.run(async function waiter() {
		const entities = await world.overworld.runCommandAsync(`testfor @e`);
		if (entities.successCount < 1) {
			// No players found, we need to re-run this...
			return system.run(waiter);
		}

		console.warn("WORLD LOADED");

		WORLD_IS_LOADED = true;
		ON_LOAD_CALLBACKS.forEach((callback) => callback());

		resolve();
	})
);

/**
 * Runs function when first player was found by scrpits. Automatically catches any error Uses "testfor" and runCommandAsync underhood.
 * @template {Function} FN
 * @param {FN} callback
 * @param {(func: FN) => any} handler
 * @returns {void}
 */
export function onWorldLoad(callback, handler = (func) => util.handle(func)) {
	if (WORLD_IS_LOADED) return handler(callback);

	ON_LOAD_CALLBACKS.push(() => handler(callback));
}

// To not export rare usable things, i put them to exported function
onWorldLoad.promise = ON_LOAD_PROMISE;
onWorldLoad.loaded = () => WORLD_IS_LOADED;
