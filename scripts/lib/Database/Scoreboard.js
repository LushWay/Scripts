import { Entity, ScoreboardObjective, world } from "@minecraft/server";

export class ScoreboardDB {
	/**
	 * Gets entity.scroebaordIdentity or creates if not exists
	 * @param {Entity} entity
	 */
	static ID(entity) {
		return (
			entity.scoreboardIdentity ??
			(entity.runCommand(`scoreboard players set @s "${this.name}" 0`),
			entity.scoreboardIdentity)
		);
	}
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
			/** @type {ScoreboardObjective} */
			this.scoreboard = world.scoreboard.addObjective(name, displayName);
		} catch (e) {
			/** @type {ScoreboardObjective} */
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
				.find((e) => e.participant.displayName === name)?.score;
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
		const id =
			entity.scoreboardIdentity ??
			(entity.runCommand(`scoreboard players set @s "${this.name}" ${value}`),
			entity.scoreboardIdentity);
		if (!id) return;

		this.scoreboard.setScore(id, value);
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	add(entity, value) {
		const score = this.get(entity) ?? 0;
		const id =
			entity.scoreboardIdentity ??
			(entity.runCommand(`scoreboard players add @s "${this.name}" ${value}`),
			entity.scoreboardIdentity);
		if (!id) return;

		this.scoreboard.setScore(id, score + value);
	}
	/**
	 *
	 * @param {Entity} entity
	 * @returns {number}
	 */
	get(entity) {
		try {
			if (!entity.scoreboardIdentity) return 0;
			const result = this.scoreboard.getScore(entity.scoreboardIdentity);
			if (typeof result !== "number") return 0;
			else return result;
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
