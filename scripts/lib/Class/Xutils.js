import { Block, BlockLocation, BoolBlockProperty, IntBlockProperty, StringBlockProperty } from "@minecraft/server";
import { ThrowError } from "../../xapi.js";

export const XUtils = {
	/**
	 *
	 * @template T
	 * @param {Vector3} loc1
	 * @param {Vector3} loc2
	 * @param {EX<T, boolean>} convert
	 * @returns {Generator<T extends true ? BlockLocation : Vector3, void, unknown>}
	 */
	*safeBlocksBetween(loc1, loc2, convert) {
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
	},
	/**
	 *
	 * @param {Vector3} loc1
	 * @param {Vector3} loc2
	 */
	getBlocksCount(loc1, loc2) {
		const minmax = (/** @type {number} */ v1, /** @type {number} */ v2) => [Math.min(v1, v2), Math.max(v1, v2)];
		const [xmin, xmax] = minmax(loc1.x, loc2.x);
		const [zmin, zmax] = minmax(loc1.z, loc2.z);
		const [ymin, ymax] = minmax(loc1.y, loc2.y);
		const x = xmax - xmin + 1;
		const y = ymax - ymin + 1;
		const z = zmax - zmin + 1;
		return x * y * z;
	},
	/**
	 * Converts a location to a block location
	 * @param {Vector3} loc a location to convert
	 * @returns {BlockLocation}
	 */
	vecToBlockLocation(loc) {
		return new BlockLocation(Math.floor(loc.x), Math.floor(loc.y), Math.floor(loc.z));
	},
	/**
	 * Returns the block data of a block.
	 * @param {Block} block - Block to get data
	 * @returns {number} Data
	 */
	getBlockData(block) {
		const allProperies = block.permutation.getAllProperties();
		const needProps = allProperies.filter((p) => "validValues" in p);

		/** @type {StringBlockProperty | IntBlockProperty} */
		// @ts-expect-error
		const main = needProps.find((e) => typeof e.value === "string" || typeof e.value === "number");

		/** @type {BoolBlockProperty} */
		// @ts-expect-error
		const bit = needProps.find((e) => typeof e.value === "boolean");

		const data = main?.validValues?.findIndex((e) => e === main.value);

		// Cannot find property...
		if (!data) return 0;
		if (bit.value) return data + main.validValues.length;
		else return data;
	},
};
