import { system } from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";

var WORLD_IS_LOADED = false;

/** @type {Function[]} */
var onLoad = [];

let s = system.runSchedule(async () => {
	try {
		await DIMENSIONS.overworld.runCommandAsync(`testfor @a`);
		system.clearRunSchedule(s);
		WORLD_IS_LOADED = true;
		onLoad.forEach((e) => e());
	} catch (error) {}
}, 1);

/**
 * Awaits till work load
 * @returns {Promise<void>}
 */
export async function awaitWorldLoad() {
	if (WORLD_IS_LOADED) return;
	return new Promise((resolve) => {
		onLoad.push(resolve);
	});
}

/**
 * Sends a callback once world is loaded
 * @param {() => void} callback  undefined
 * @returns {void}
 */
export function onWorldLoad(callback) {
	if (WORLD_IS_LOADED) return callback();
	onLoad.push(callback);
}
