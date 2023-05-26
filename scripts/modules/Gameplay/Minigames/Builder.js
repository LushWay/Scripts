import { Player } from "@minecraft/server";

export class Minigame {
	/** @type {string[]} */
	players = [];

	/** @type {Set<string>} */
	quene = new Set();
	/**
	 * Creates new Minigame manager.
	 * @param {string} name - Name of the minigame. Needs to stay unique.
	 * @param {object} o - Options.
	 * @param {Vector3} o.spawn - Minigame spawn
	 */
	constructor(name, { spawn }) {
		this.name = name;
		this.spawn = spawn;

		Minigame.MINIGAMES[name] = this;
	}

	/** @type {Record<string, Minigame>} */
	static MINIGAMES = {};
	/**
	 * @param {Player} player
	 */
	static getMinigame(player) {
		return Object.values(this.MINIGAMES).find((e) =>
			e.players.includes(player.id)
		);
	}
	/**
	 * @param {Player} player
	 */
	static getQuene(player) {
		return Object.values(this.MINIGAMES).find((e) => e.quene.has(player.id));
	}
}
