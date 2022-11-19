import { BlockLocation } from "@minecraft/server";
import { sleep } from "../../../xapi.js";
import { Region } from "../utils/Region.js";

/**
 * @param {IRegionCords} center
 * @param {number} x
 * @param {number} z
 * @returns {IRegionCords}
 */
function moveCenter(center, x, z) {
	return { x: center.x + x * 30, z: center.z + z * 30 };
}

/**
 * @returns {Promise<{from: IRegionCords, to: IRegionCords}>}
 */
export async function findFreePlace() {
	let center = { x: 0, z: 0 };
	let tries = 0;
	let from;
	let to;
	const visited = new WeakSet();

	while (!from) {
		if (tries >= 10) await sleep(1), (tries = 0);

		const reg = Region.blockLocationInRegion(
			new BlockLocation(center.x, 0, center.z),
			"overworld"
		);

		if (reg) {
			center = moveCenter(center, 1, 1);
			if (visited.has(center)) center = moveCenter(center, 1, 1);
			visited.add(center);
		} else {
			from = { x: center.x - 15, z: center.z - 15 };
			to = { x: center.x + 15, z: center.z + 15 };
			break;
		}
	}

	return { from, to };
}
