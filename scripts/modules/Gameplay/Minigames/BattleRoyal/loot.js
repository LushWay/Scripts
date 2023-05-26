// @ts-nocheck
import { ItemStack, MinecraftBlockTypes, world } from "@minecraft/server";
import { rd } from "../../Airdrops/index.js";

/**
 * @type {Array<ItemStack>}
 */
const drops = [];

export class LootChest {
	/**
	 *
	 * @param {number} posx
	 * @param {number} posz
	 * @param {number} loot_tier
	 */
	constructor(posx, posz, loot_tier = 1, rdrad) {
		this.pos = LootChest.summon(
			posx,
			posz,
			LootChest.getTable(loot_tier),
			rdrad
		);
	}
	static getTable(t) {
		return drops;
	}
	static summon(xz, zx, loot, rdrad) {
		let x,
			z,
			C = 0,
			block;
		while (!block && C < 150) {
			C++;
			x = rd(xz + rdrad, xz - rdrad);
			z = rd(zx + rdrad, zx - rdrad);
			/** @type {import("@minecraft/server").BlockRaycastOptions} */
			const q = {
				includeLiquidBlocks: false,
				includePassableBlocks: false,
				maxDistance: 100,
			};
			const b = world
				.getDimension("overworld")
				.getBlockFromRay({ x: x, y: 320, z }, { x: 0, y: -1, z: 0 });
			if (b && b.location.y >= 50) {
				block = b.dimension.getBlock({
					x: b.location.x,
					y: b.location.y + 1,
					z: b.location.z,
				});
				break;
			}
		}

		// TODO! LOOT

		if (!block) return false;
		block.setType(MinecraftBlockTypes.chest);

		return `${block.location.x} ${block.location.y} ${block.location.z}`;
	}
}
