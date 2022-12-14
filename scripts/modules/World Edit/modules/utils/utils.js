import { BlockLocation, MinecraftBlockTypes } from "@minecraft/server";
import { DIMENSIONS } from "../../../../lib/List/dimensions.js";
import { ThrowError, XA } from "../../../../xapi.js";

/**
 *
 * @template T
 * @param {Vector3} loc1
 * @param {Vector3} loc2
 * @param {EX<T, boolean>} convert
 * @returns {Generator<T extends true ? BlockLocation : Vector3, void, unknown>}
 */
export function* safeBlocksBetween(loc1, loc2, convert) {
	try {
		const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
		const [xmin, xmax] = minmax(loc1.x, loc2.x);
		const [zmin, zmax] = minmax(loc1.z, loc2.z);
		const [ymin, ymax] = minmax(loc1.y, loc2.y);
		for (let x = xmin; x <= xmax; x++) {
			for (let z = zmin; z <= zmax; z++) {
				for (let y = ymin; y <= ymax; y++) {
					// @ts-expect-error
					if (convert) yield new BlockLocation(x, y, z);
					// @ts-expect-error
					else yield { x, y, z };
				}
			}
		}
	} catch (e) {
		ThrowError(e);
	}
}

/**
 *
 * @param {Vector3} loc1
 * @param {Vector3} loc2
 */
export function getBlocksCount(loc1, loc2) {
	const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
	const [xmin, xmax] = minmax(loc1.x, loc2.x);
	const [zmin, zmax] = minmax(loc1.z, loc2.z);
	const [ymin, ymax] = minmax(loc1.y, loc2.y);
	const x = xmax - xmin + 1;
	const y = ymax - ymin + 1;
	const z = zmax - zmin + 1;
	return x * y * z;
}

/**
 *
 * @param {string} blockTypeID
 * @param {BlockLocation} location
 * @returns
 */
export function setblock(blockTypeID, location) {
	if (/^(.+)\.(\d+)/g.test(blockTypeID)) {
		// Block is written like "stone.3", so we need to get data and id
		const [_, id, data] = /^(.+)\.(\d+)/g.exec(blockTypeID);
		XA.runCommandX(`setblock ${location.x} ${location.y} ${location.z} ${id} ${data}`);
	} else {
    // Normal block type
		const blockType = MinecraftBlockTypes.get(`minecraft:${blockTypeID}`);
		if (!blockType) return ThrowError(new TypeError(`BlockType ${blockTypeID} does not exist!`));
		DIMENSIONS.overworld.getBlock(location).setType(blockType);
	}
}
