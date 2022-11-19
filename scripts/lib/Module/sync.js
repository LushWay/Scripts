const SYNCED_DATA = {};

/**
 * Registers sycnable data
 * @param {string} name Name
 * @param {any} data Data to sync
 */
function sync(name, data) {
	SYNCED_DATA[name] = data;
}

/**
 * Gets data from other modules
 * @param {string} name Name of data to get
 * @throws
 * @returns {any}
 */
function require(name) {
	const synced = SYNCED_DATA[name];
	if (!synced) throw new Error("Unable to get synced data with name §f" + name);
	return synced;
}

export const XMSync = {
	sync,
	require,
};
