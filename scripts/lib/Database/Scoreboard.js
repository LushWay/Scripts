import { Entity, world } from "@minecraft/server";
import { DIMENSIONS } from "../List/dimensions.js";

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
	 * @param {string} option
	 * @param {number} value
	 */
	set(option, value) {
		DIMENSIONS.overworld.runCommand(`scoreboard players set "${option}" ${this.name} ${value}`);
	}
	/**
	 *
	 * @param {string} option
	 * @returns
	 */
	get(option) {
		try {
			return this.scoreboard.getScores().find((e) => e.participant.displayName === option).score;
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
			this.scoreboard.getScore(entity.scoreboard);
		} catch (e) {
			return 0;
		}
	}
	reset() {
		DIMENSIONS.overworld.runCommand(`scoreboard players reset * ${this.name}`);
	}
}
