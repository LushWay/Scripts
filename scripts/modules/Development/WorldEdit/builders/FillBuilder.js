import { system, world } from "@minecraft/server";
import { util } from "xapi.js";
import { CONFIG_WE } from "../config.js";
import { WorldEditBuild } from "./WorldEditBuilder.js";

/**
 * Sets Pos1 To a new Block Location
 * @param {Vector3} pos1 pos1
 * @param {Vector3} pos2 pos2
 * @param {Array<string>} blocks blocks to use to fill block
 * @param {string} rb Blocks to replace
 * @example new Fill(BlockLocation, BlockLocation, ["stone", "wood"], ["grass"]);
 */
export function FillFloor(pos1, pos2, blocks, rb = "any") {
	util.catch(async () => {
		WorldEditBuild.backup(pos1, pos2);

		try {
			let rbs = [];
			if (rb)
				for (let рбд of rb.split(",")) {
					rbs.push({
						b: рбд.split(".")[0],
						d: рбд.split(".")[1] ?? "0",
					});
				}

			let blocksSet = 0;
			for (let x = pos1.x; x <= pos2.x; x++) {
				for (let y = pos1.y; y <= pos2.y; y++) {
					for (let z = pos1.z; z <= pos2.z; z++) {
						let dom = ~~(Math.random() * blocks.length);
						let block = blocks[dom].split(".")[0];
						let bdata = block[dom].split(".")[1] ?? "0";
						if (rb !== "any") {
							for (const b of rbs) {
								let replace = ` replace ${b.b} ` + b.d;
								world.overworld.runCommand(
									`fill ${x} ${y} ${z} ${x} ${y} ${z} ${block} ` +
										bdata +
										replace
								);
							}
						} else
							world.overworld.runCommand(
								`fill ${x} ${y} ${z} ${x} ${y} ${z} ${block} ` + bdata
							);

						blocksSet++;
					}
				}
				if (blocksSet >= CONFIG_WE.BLOCKS_BEFORE_AWAIT) {
					await system.sleep(CONFIG_WE.TICKS_TO_SLEEP);
					blocksSet = 0;
				}
			}
		} catch (error) {
			console.warn(error + error.stack);
		}
	});
}
