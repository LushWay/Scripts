import { Entity, Player, world } from "@minecraft/server";

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
		world.overworld.runCommand(
			`scoreboard players set "${name}" ${this.name} ${value}`,
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
		const id = ScoreboardDB.ID(entity);
		if (!id) return;

		this.scoreboard.setScore(id, value);
	}
	/**
	 *
	 * @param {Entity} entity
	 * @param {number} value
	 */
	add(entity, value) {
		const score = this.get(entity);
		const id = ScoreboardDB.ID(entity);
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
		world.overworld.runCommand(`scoreboard players reset * ${this.name}`);
	}
}

Reflect.defineProperty(Player.prototype, "scores", {
	configurable: false,
	enumerable: true,
	get() {
		/** @type {Player} */
		const player = this;
		return new Proxy(
			{
				leafs: 0,
				money: 0,
			},
			{
				set(_, p, newValue) {
					if (typeof p === "symbol")
						throw new Error("Symbol objectives are not accepted");

					if (!player.scoreboardIdentity)
						player.runCommand(`scoreboard players set @s ${p} 0`);

					objective(p).setScore(player, newValue);
					return true;
				},
				get(_, p) {
					if (typeof p === "symbol")
						throw new Error("Symbol objectives are not accepted");

					if (!player.scoreboardIdentity) return 0;
					return objective(p).getScore(player);
				},
			},
		);
	},
});

/**
 *
 * @param {string} p
 */
function objective(p) {
	return (
		world.scoreboard.getObjective(p) ?? world.scoreboard.addObjective(p, p)
	);
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
