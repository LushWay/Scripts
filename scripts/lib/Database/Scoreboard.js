import { Entity, world } from "@minecraft/server";

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
	nameSet(name, value) {
		world.overworld.runCommandAsync(
			`scoreboard players set "${name}" ${this.name} ${value}`
		);
	}
	/**
	 *
	 * @param {string} name
	 * @returns
	 */
	nameGet(name) {
		try {
			return this.scoreboard
				.getScores()
				.find((e) => e.participant.displayName === name).score;
		} catch (e) {
			return 0;
		}
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	set(entity, value) {
		this.scoreboard.setScore(entity.scoreboardIdentity, value);
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	add(entity, value) {
		this.scoreboard.setScore(
			entity.scoreboardIdentity,
			this.get(entity) + value
		);
	}
	/**
	 *
	 * @param {Entity} entity
	 */
	get(entity) {
		try {
			return this.scoreboard.getScore(entity.scoreboardIdentity);
		} catch (e) {
			return 0;
		}
	}
	reset() {
		world.overworld.runCommandAsync(`scoreboard players reset * ${this.name}`);
	}
}

/*
const objective = new ScoreboardDB('objectiveName', 'display name')

const score = objective.get(player)
objective.set(player, 1)
objective.add(player, 1)

objective.nameSet('custom name', 1)
objective.nameGet('custom name')

objective.reset()
*/
