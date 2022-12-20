import { Entity, world } from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";

/**
 * @template Func, [This = any]
 * @param {Func} func
 * @param {This} context
 * @returns {Func}
 */
function BIND(func, context) {
	if (typeof func !== "function") return func;
	return func.bind(context);
}

export class ScoreboardDB {
	scoreboard;
	/**
	 *
	 * @param {string} name
	 * @param {string} [displayName]
	 */
	constructor(name, displayName = "a") {
		displayName = displayName ?? name;
		if (name.length > 16) name = name.substring(0, 16);
		this.name = name;
		this.displayName = displayName;

		try {
			this.scoreboard = world.scoreboard.addObjective(name, displayName);
		} catch (e) {
			this.scoreboard = world.scoreboard.getObjective(name);
		}
	}
	/**
	 * @param {string} name
	 * @param {number} value
	 */
	set(name, value) {
		DIMENSIONS.overworld.runCommandAsync(`scoreboard players set "${name}" ${this.name} ${value}`);
	}
	/**
	 *
	 * @param {string} name
	 * @returns
	 */
	get(name) {
		try {
			return this.scoreboard.getScores().find((e) => e.participant.displayName === name).score;
		} catch (e) {
			return 0;
		}
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	eSet(entity, value) {
		entity.runCommandAsync(`scoreboard players set @s ${this.name} ${value}`);
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	eAdd(entity, value) {
		entity.runCommandAsync(`scoreboard players add @s ${this.name} ${value}`);
	}
	/**
	 *
	 * @param {Entity} entity
	 */
	eGet(entity) {
		try {
			return this.scoreboard.getScore(entity.scoreboard);
		} catch (e) {
			return 0;
		}
	}
	reset() {
		DIMENSIONS.overworld.runCommandAsync(`scoreboard players reset * ${this.name}`);
	}
}
