import { XA } from "xapi.js";

/**
 * Registers sycnable data
 * @param {string} name Name
 * @param {any} data Data to sync
 */
function register(name, data) {
	XA.Module.data[name] = data;
}

/**
 * Gets data from other modules
 * @param {string} name Name of data to get
 * @throws
 * @returns {any}
 */
function get(name) {
	const synced = XA.Module.data[name];
	if (!synced) throw new Error("Unable to get synced data with name §f" + name);
	return synced;
}

export const MSync = {
	data: {},
	register,
	get,
};
