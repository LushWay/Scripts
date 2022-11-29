import { BlockLocation, MinecraftDimensionTypes } from "@minecraft/server";
import { sleep } from "../../../xapi.js";
import { Region } from "../utils/Region.js";
const size = 30; // size
const size2 = size / 2 - 1;

/**
 * @param {IRegionCords} center
 * @param {number} x
 * @param {number} z
 * @returns {IRegionCords}
 */
function moveCenter(center, x, z) {
	return { x: center.x + x * size, z: center.z + z * size };
}

/**
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function moveEls(arr) {
	const lm = arr.shift();
	return undefined !== lm ? [...arr, lm] : arr;
}

/**
 * @returns {Promise<{from: IRegionCords, to: IRegionCords}>}
 */
export async function findFreePlace() {
	let center = { x: 0, z: 0 };
	let tries = 0;
	let from;
	let to;
	const visited = [];
	let x = [-1, 0, 1, 0];
	let z = [0, -1, 0, 1];

	while (!from) {
		tries++;
		if (tries >= 20) await sleep(1), (tries = 0);

		const alreadyExist = Region.blockLocationInRegion(
			new BlockLocation(center.x, 0, center.z),
			MinecraftDimensionTypes.overworld
		);

		if (alreadyExist) {
			const nextCenter = moveCenter(center, x[1], z[1]);
			if (!visited.includes(nextCenter.x + " " + nextCenter.z)) {
				x = moveEls(x);
				z = moveEls(z);
			}

			center = moveCenter(center, x[0], z[0]);
			visited.push(center.x + " " + center.z);
		} else {
			from = { x: center.x - size2, z: center.z - size2 };
			to = { x: center.x + size2, z: center.z + size2 };
			break;
		}
	}

	return { from, to };
}
