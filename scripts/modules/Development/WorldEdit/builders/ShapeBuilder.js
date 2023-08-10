import { MinecraftBlockTypes, system, Vector, world } from "@minecraft/server";
import { util } from "xapi.js";
import { CONFIG_WB } from "../config.js";
import { Cuboid } from "../utils/Cuboid.js";
import { setblock } from "../utils/utils.js";
import { WorldEditBuild } from "./WorldEditBuilder.js";

export class Shape {
	/**
	 * Sets Pos1 To a new Block Location
	 * @param {string} shape shape equation to caculate
	 * @param {Vector3} pos location to generate shape
	 * @param {Array<string>} blocks blocks to use to fill block
	 * @param {number} rad size of sphere
	 * @example new Shape(DefaultModes.sphere,BlockLocation, ["stone", "wood"], 10);
	 */
	constructor(shape, pos, blocks, rad) {
		this.shape = shape;
		this.blocks = blocks;
		this.pos = pos;
		this.rad = rad;
		this.pos1 = Vector.add(pos, { x: -rad, y: -rad, z: -rad });
		this.pos2 = Vector.add(pos, { x: rad, y: rad, z: rad });

		WorldEditBuild.backup(this.pos1, this.pos2);

		this.values = new Cuboid(this.pos1, this.pos2);

		try {
			this.generate();
		} catch (e) {
			util.error(e);
		}
	}
	/**
	 * Generates the shape to location
	 */
	async generate() {
		let blocksSet = 0;

		const loc1 = { x: -this.rad, y: -this.rad, z: -this.rad };
		const loc2 = { x: this.rad, z: this.rad, y: this.rad };

		for (const { x, y, z } of Vector.foreach(loc1, loc2)) {
			if (!this.condition(x, y, z)) continue;
			const location = Vector.add(this.pos, { x, y, z });
			const block = this.blocks[~~(Math.random() * this.blocks.length)];
			setblock(block, location);
			blocksSet++;

			if (blocksSet >= CONFIG_WB.BLOCKS_BEFORE_AWAIT) {
				await system.sleep(CONFIG_WB.TICKS_TO_SLEEP);
				blocksSet = 0;
			}
		}
	}
	/**
	 * Tests weather the courrent coordinate should have a block there
	 * @param {number} x x number to test
	 * @param {number} y y number to test
	 * @param {number} z z number to test
	 */
	condition(x, y, z) {
		return new Function(
			"x, y, z, {xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter, xRadius, yRadius, zRadius}, rad",
			`return ${this.shape}`
		)(x, y, z, this.values, this.rad);
	}
}

export class spawn {
	/**
	 * @param {boolean} remove
	 */
	constructor(pos1x = 0, pos1z = 0, pos2x = 0, pos2z = 0, remove = false) {
		this.x1 = pos1x;
		this.x2 = pos2x;
		this.z1 = pos1z;
		this.z2 = pos2z;
		this.r = remove;

		WorldEditBuild.backup(
			{ x: this.x1, y: -64, z: this.z1 },
			{ x: this.x2, y: -64, z: this.z2 }
		);

		try {
			this.generate();
		} catch (e) {
			util.error(e);
		}
	}
	/**
	 * Generates the shape to location
	 */
	async generate() {
		let v = {
			xmin: Math.min(this.x1, this.x2),
			xmax: Math.max(this.x1, this.x2),
			zmin: Math.min(this.z1, this.z2),
			zmax: Math.max(this.z1, this.z2),
		};
		let blocksSet = 0;
		for (let x = v.xmin; x <= v.xmax; x++) {
			for (let z = v.zmin; z <= v.zmax; z++) {
				world.overworld
					.getBlock({ x: x, y: -64, z: z })
					.setType(
						MinecraftBlockTypes.get(
							!this.r ? "minecraft:deny" : "minecraft:bedrock"
						)
					);
				blocksSet++;
			}
			if (blocksSet >= CONFIG_WB.BLOCKS_BEFORE_AWAIT) {
				await system.sleep(CONFIG_WB.TICKS_TO_SLEEP);
				blocksSet = 0;
			}
		}
	}
}
