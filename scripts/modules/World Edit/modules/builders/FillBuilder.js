import { BlockLocation } from "@minecraft/server";
import { sleep, XA } from "xapi.js";
import { WB_CONFIG } from "../../config.js";
import { Cuboid } from "../utils/Cuboid.js";
import { WorldEditBuild } from "./WorldEditBuilder.js";

export class Fill {
	/**
	 * Sets Pos1 To a new Block Location
	 * @param {BlockLocation} pos1 pos1
	 * @param {BlockLocation} pos2 pos2
	 * @param {Array<string>} blocks blocks to use to fill block
	 * @param {string} rb Blocks to replace
	 * @example new Fill(BlockLocation, BlockLocation ["stone", "wood"], ["grass"]);
	 */
	constructor(pos1, pos2, blocks, rb = "any") {
		this.blocks = blocks;
		this.pos1 = pos1;
		this.pos2 = pos2;
		this.rb = rb;
		WorldEditBuild.backup(this.pos1, this.pos2);

		this.values = new Cuboid(this.pos1, this.pos2);

		this.generate();
	}
	/**
	 * Generates the shape to location
	 */
	async generate() {
		try {
			let rbs = [];
			if (this.rb)
				for (let рбд of this.rb.split(",")) {
					rbs.push({
						b: рбд.split(".")[0],
						d: рбд.split(".")[1] ?? "0",
					});
				}

			let blocksSet = 0;
			for (let x = this.pos1.x; x <= this.pos2.x; x++) {
				for (let y = this.pos1.y; y <= this.pos2.y; y++) {
					for (let z = this.pos1.z; z <= this.pos2.z; z++) {
						//const location = new BlockLocation(x,y,z);
						//if (this.rb != "any" && this.rb.includes(world.getDimension("overworld").getBlock(location).id)) continue;
						let dom = ~~(Math.random() * this.blocks.length);
						let blocks = this.blocks[dom].split(".")[0];
						let bdata = this.blocks[dom].split(".")[1] ?? "0";
						if (this.rb != "any") {
							for (const b of rbs) {
								let replace = ` replace ${b.b} ` + b.d;
								XA.runCommandX(`fill ${x} ${y} ${z} ${x} ${y} ${z} ${blocks} ` + bdata + replace);
							}
						} else XA.runCommandX(`fill ${x} ${y} ${z} ${x} ${y} ${z} ${blocks} ` + bdata);

						blocksSet++;
					}
				}
				if (blocksSet >= WB_CONFIG.BLOCKS_BEFORE_AWAIT) {
					await sleep(WB_CONFIG.TICKS_TO_SLEEP);
					blocksSet = 0;
				}
			}
		} catch (error) {
			console.warn(error + error.stack);
		}
	}
}
