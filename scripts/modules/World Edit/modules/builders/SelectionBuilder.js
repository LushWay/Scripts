import { BlockLocation } from "@minecraft/server";
import { WorldEditBuild } from "./WorldEditBuilder.js";

export class SelectionBuilder {
  /**
   * Sets Pos1 To a new Block Location
   * @param {number} x location x of pos1
   * @param {number} y location y of pos1
   * @param {number} z location z of pos1
   * @returns {void}
   * @example setPos1(11, 16, 10);
   */
  setPos1(x, y, z) {
    WorldEditBuild.pos1 = new BlockLocation(x, y, z);
  }
  /**
   * Sets Pos1 To a new Block Location
   * @param {number} x location x of pos1
   * @param {number} y location y of pos1
   * @param {number} z location z of pos1
   * @returns {void}
   * @example setPos1(11, 16, 10);
   */
  setPos2(x, y, z) {
    WorldEditBuild.pos2 = new BlockLocation(x, y, z);
  }
  /**
   * Expands the selection area
   * @param {number} amount ammount to expand selection in all directions
   * @returns {void}
   * @example expand(11);
   */
  expand(amount) {
    const dx = WorldEditBuild.pos2.x - WorldEditBuild.pos1.x;
    const dz = WorldEditBuild.pos2.z - WorldEditBuild.pos1.z;

    if (dx < 0 && dz < 0) {
      //means u need to sub,  sub to get to pos1
      WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(amount, -amount, amount);
      WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(
        -amount,
        amount,
        -amount
      );
    } else if (dx < 0 && dz >= 0) {
      //means u need to sub,  add to get to pos1
      WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(
        amount,
        -amount,
        -amount
      );
      WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(-amount, amount, amount);
    } else if (dx >= 0 && dz >= 0) {
      //means u need to add,  add to get to pos1
      WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(
        -amount,
        -amount,
        -amount
      );
      WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(amount, amount, amount);
    } else if (dx >= 0 && dz < 0) {
      //means u need to add, sub to get to pos1
      WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(
        -amount,
        -amount,
        amount
      );
      WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(amount, amount, -amount);
    }
  }
  /**
   * Expands the selection verticly
   * @param {number} amount ammount to expand selection in all directions
   * @returns {void}
   * @example expandVert(11);
   */
  expandVert(amount) {
    WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(0, amount, 0);
  }
  /**
   * Counts the number of blocks matching a mask
   * @returns {number}
   * @example count();
   */
  count() {
    return WorldEditBuild.pos1.blocksBetween(WorldEditBuild.pos2)?.length ?? 0;
  }
}
export const SelectionBuild = new SelectionBuilder();
