import { system } from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";
import { handle } from "./utils.js";

var WORLD_IS_LOADED = false;

/** @type {Function[]} */
var ON_LOAD_CALLBACKS = [];

var ON_LOAD_PROMISE = new Promise((resolve) =>
	system.run(async function waiter() {
		const players = await DIMENSIONS.overworld.runCommandAsync(`testfor @a`);
		if (players.successCount < 1) {
			// No players found, we need to re-run this...
			return system.run(waiter);
		}

		console.warn("WORLD LOADED");

		WORLD_IS_LOADED = true;
		ON_LOAD_CALLBACKS.forEach((callback) => handle(callback));

		resolve();
	})
);

/**
 * Runs function when first player was found by scrpits. Automatically catches any error Uses "testfor" and runCommandAsync underhood.
 * @param {Function} callback
 * @returns {Promise<void>}
 */
export async function onWorldLoad(callback) {
	if (WORLD_IS_LOADED) return handle(callback);

	ON_LOAD_CALLBACKS.push(() => handle(callback));
}

// To not export rare usable things, i put them to exported function
onWorldLoad.promise = ON_LOAD_PROMISE;
onWorldLoad.callbacks = ON_LOAD_CALLBACKS;
onWorldLoad.loaded = () => WORLD_IS_LOADED;
