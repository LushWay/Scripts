/**
 * @typedef {Object} ChunkSize
 * @property {number} x - The max Length of a chunk
 * @property {number} y - The max Height of a chunk
 * @property {number} z - The max Width of a chunk
 */

import { BlockLocation } from "@minecraft/server";
import { WB_CONFIG } from "../../config.js";

export class Cuboid {
	/**
	 *
	 * @param {Vector3} pos1
	 * @param {Vector3} pos2
	 */
	constructor(pos1, pos2) {
		this.pos1 = new BlockLocation(pos1.x, pos1.y, pos1.z);
		this.pos2 = new BlockLocation(pos2.x, pos2.y, pos2.z);

		this.xMin = Math.min(this.pos1.x, this.pos2.x);
		this.yMin = Math.min(this.pos1.y, this.pos2.y);
		this.zMin = Math.min(this.pos1.z, this.pos2.z);
		this.xMax = Math.max(this.pos1.x, this.pos2.x);
		this.yMax = Math.max(this.pos1.y, this.pos2.y);
		this.zMax = Math.max(this.pos1.z, this.pos2.z);

		this.min = {
			x: this.xMin,
			y: this.yMin,
			z: this.zMin,
		};

		this.max = {
			x: this.xMax,
			y: this.yMax,
			z: this.zMax,
		};

		this.xRadius = (this.xMax - this.xMin) / 2;
		this.yRadius = (this.yMax - this.yMin) / 2;
		this.zRadius = (this.zMax - this.zMin) / 2;
		this.xCenter = (this.xMax + this.xMin) / 2;
		this.yCenter = (this.yMax + this.yMin) / 2;
		this.zCenter = (this.zMax + this.zMin) / 2;
	}
	/**
	 * Returns the ammount of blocks in this cuboid
	 * @returns {number}
	 */
	get blocksBetween() {
		let blocks = 0;
		for (const cube of this.split(WB_CONFIG.FILL_CHUNK_SIZE)) {
			blocks += cube.pos1.blocksBetween(cube.pos2).length;
		}
		return blocks;
	}
	/**
	 * Splits a cuboid into mulitple cuboid of a chunk size
	 * @param {Vector3} size
	 * @returns {Array<Cuboid>}
	 */
	split(size = { x: 1, y: 1, z: 1 }) {
		const breakpoints = {
			x: [],
			y: [],
			z: [],
		};
		const cubes = [];

		for (const [axis, value] of Object.entries(size)) {
			for (let coordinate = this.min[axis]; ; coordinate = coordinate + value) {
				if (coordinate < this.max[axis]) {
					breakpoints[axis].push(coordinate);
				} else {
					breakpoints[axis].push(this.max[axis]);
					break;
				}
			}
		}

		breakpoints.x.forEach((x, x_index) => {
			breakpoints.y.forEach((y, y_index) => {
				breakpoints.z.forEach((z, z_index) => {
					let CurCord = {
						x: x,
						y: y,
						z: z,
					};

					let indexOf = {
						x: x_index,
						y: y_index,
						z: z_index,
					};

					let NextCord = {};
					for (let axis in breakpoints) {
						let nextValue = breakpoints[axis][indexOf[axis] + 1];

						if (!nextValue && breakpoints[axis].length > 1) return;

						NextCord[axis] = nextValue ?? CurCord[axis];

						if (NextCord[axis] !== this.max[axis]) NextCord[axis]--;
					}

					// @ts-ignore
					cubes.push(new Cuboid(CurCord, NextCord));
				});
			});
		});

		return cubes;
	}
}
