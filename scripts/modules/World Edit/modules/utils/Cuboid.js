// @ts-nocheck

/**
 * @typedef {Object} ChunkSize
 * @property {number} x - The max Length of a chunk
 * @property {number} y - The max Height of a chunk
 * @property {number} z - The max Width of a chunk
 */

import { BlockLocation } from "@minecraft/server";
import { configuration } from "../config.js";

export class Cuboid {
  constructor(pos1, pos2) {
    this.pos1 = new BlockLocation(pos1.x, pos1.y, pos1.z);
    this.pos2 = new BlockLocation(pos2.x, pos2.y, pos2.z);

    this.min = {
      x: this.xMin(),
      y: this.yMin(),
      z: this.zMin(),
    };

    this.max = {
      x: this.xMax(),
      y: this.yMax(),
      z: this.zMax(),
    };

    this.xMin = this.xMin();
    this.yMin = this.yMin();
    this.zMin = this.zMin();
    this.xMax = this.xMax();
    this.yMax = this.yMax();
    this.zMax = this.zMax();
    this.xRadius = this.xRadius();
    this.yRadius = this.yRadius();
    this.zRadius = this.zRadius();
    this.xCenter = this.xCenter();
    this.yCenter = this.yCenter();
    this.zCenter = this.zCenter();
  }
  /** Returns the lowest x of the Cuboid */
  xMin() {
    return Math.min(this.pos1.x, this.pos2.x);
  }
  /** Returns the lowest y of the Cuboid */
  yMin() {
    return Math.min(this.pos1.y, this.pos2.y);
  }
  /** Returns the lowest z of the Cuboid */
  zMin() {
    return Math.min(this.pos1.z, this.pos2.z);
  }
  /** Returns the highest x of the Cuboid */
  xMax() {
    return Math.max(this.pos1.x, this.pos2.x);
  }
  /** Returns the highest y of the Cuboid */
  yMax() {
    return Math.max(this.pos1.y, this.pos2.y);
  }
  /** Returns the highest z of the Cuboid */
  zMax() {
    return Math.max(this.pos1.z, this.pos2.z);
  }
  /** Returns the Radius x of the Cuboid */
  xRadius() {
    return (this.xMax - this.xMin) / 2;
  }
  /** Returns the Radius y of the Cuboid */
  yRadius() {
    return (this.yMax - this.yMin) / 2;
  }
  /** Returns the Radius z of the Cuboid */
  zRadius() {
    return (this.zMax - this.zMin) / 2;
  }
  /** Returns the center x of the cube */
  xCenter() {
    return (this.xMax + this.xMin) / 2;
  }
  /** Returns the center y of the cube */
  yCenter() {
    return (this.yMax + this.yMin) / 2;
  }
  /** Returns the center z of the cube */
  zCenter() {
    return (this.zMax + this.zMin) / 2;
  }
  /**
   * Returns the ammount of blocks in this cuboid
   * @returns {number}
   */
  get blocksBetween() {
    let blocks = 0;
    for (const cube of this.split(configuration.FILL_CHUNK_SIZE)) {
      blocks += cube.pos1.blocksBetween(cube.pos2).length;
    }
    return blocks;
  }
  /**
   * Splits a cuboid into mulitple cuboid of a chunk size
   * @param {Object} size
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

          cubes.push(new Cuboid(CurCord, NextCord));
        });
      });
    });

    return cubes;
  }
}
