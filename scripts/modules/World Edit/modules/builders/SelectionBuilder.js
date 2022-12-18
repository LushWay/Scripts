import { WorldEditBuild } from "./WorldEditBuilder.js";

class SelectionBuilder {
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
			WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(-amount, amount, -amount);
		} else if (dx < 0 && dz >= 0) {
			//means u need to sub,  add to get to pos1
			WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(amount, -amount, -amount);
			WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(-amount, amount, amount);
		} else if (dx >= 0 && dz >= 0) {
			//means u need to add,  add to get to pos1
			WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(-amount, -amount, -amount);
			WorldEditBuild.pos2 = WorldEditBuild.pos2.offset(amount, amount, amount);
		} else if (dx >= 0 && dz < 0) {
			//means u need to add, sub to get to pos1
			WorldEditBuild.pos1 = WorldEditBuild.pos1.offset(-amount, -amount, amount);
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
}
export const SelectionBuild = new SelectionBuilder();
