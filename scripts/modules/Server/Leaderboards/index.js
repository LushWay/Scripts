import { Entity, Vector, system, world } from "@minecraft/server";
import { Database } from "lib/Database/Rubedo.js";

/**
 * @typedef {{
 *   style: keyof typeof STYLES;
 *   objective: string;
 *   location: Vector3;
 *   dimension: Dimensions
 * }} LB
 */

/**
 * @type {Database<string, LB>}
 */
const LB_DB = new Database("leaderboard");
const LEADERBOARD_TAG = "LEADERBOARD";
const LEADERBOARD_ID = "f:t";
const STYLES = {
	gray: {
		fill1: "7",
		fill2: "f",
		pos: "7",
		nick: "f",
		score: "7",
		name: "7",
	},
	orange: {
		fill1: "ф",
		fill2: "ф",
		pos: "ф",
		nick: "ф",
		score: "ф",
		name: "ф",
	},
	green: {
		fill1: "7",
		fill2: "f",
		pos: "7",
		nick: "f",
		score: "7",
		name: "7",
	},
};

export class Leaderboard {
	/**
	 * @param {Vector3} loc
	 * @param {Dimensions} dimension
	 * @param {string} id
	 */
	static get(loc, dimension, id) {
		const entity = world[dimension]
			.getEntitiesAtBlockLocation(loc)
			.find(
				(entity) =>
					entity.id === id &&
					entity.typeId === LEADERBOARD_ID &&
					entity.hasTag(LEADERBOARD_TAG)
			);

		if (!entity) return false;

		return new Leaderboard(entity);
	}
	/**
	 *
	 * @param {string} objective
	 * @param {Vector3} location
	 * @param {Dimensions} dimension
	 * @param {keyof typeof STYLES} style
	 */
	static createLeaderboard(
		objective,
		location,
		dimension = "overworld",
		style = "green"
	) {
		const data = {
			style,
			objective,
			location,
			dimension,
		};
		const entity = world
			.getDimension(dimension)
			.spawnEntity(LEADERBOARD_ID, Vector.floor(location));

		LB_DB.set(entity.id, data);
		entity.nameTag = "Updating...";
		entity.addTag(LEADERBOARD_TAG);

		return new Leaderboard(entity, data);
	}
	/**
	 * Creates manager of Leaderboard
	 * @param {Entity} entity
	 * @param {LB} data
	 */
	constructor(entity, data = LB_DB.get(entity.id)) {
		this.entity = entity;
		this.data = data;
	}
	remove() {
		LB_DB.delete(this.entity.id);
		this.entity.teleport({ x: 0, y: 0, z: 0 });
		this.entity.triggerEvent("f:t:kill");
	}
	updateData() {
		LB_DB.set(this.entity.id, this.data);
	}
	updateLeaderboard() {
		const scoreboard = world.scoreboard.getObjective(this.data.objective);
		const dname = scoreboard.displayName;
		const name = dname.charAt(0).toUpperCase() + dname.slice(1);
		const style = STYLES[this.data.style];
		const filler = `§${style.fill1}-§${style.fill2}`.repeat(20);

		let leaderboard = ``;
		for (const [i, scoreInfo] of scoreboard.getScores().entries()) {
			const { pos: t, nick: n, score: s } = style;

			leaderboard += `§${t}#${i + 1}§r `;
			leaderboard += `§${n}${scoreInfo.participant.displayName}§r `;
			leaderboard += `§${s}${toMetricNumbers(scoreInfo.score)}§r\n`;
		}

		this.entity.nameTag = `§l§${style.name}${name}\n§l${filler}§r\n${leaderboard}`;
	}
}

system.runInterval(
	() => {
		for (const [id, leaderboard] of LB_DB.entries()) {
			const lb = Leaderboard.get(
				leaderboard.location,
				leaderboard.dimension,
				id
			);

			if (lb) lb.updateLeaderboard();
		}
	},
	"leaderboardsInterval",
	10
);

/**
 * This will display in text in thousands, millions and etc... For ex: "1400 -> "1.4k", "1000000" -> "1M", etc...
 * @param {number} value The number you want to convert
 * @returns {string}
 * @example metricNumbers(15000);
 */
function toMetricNumbers(value) {
	const types = ["", "к", "млн", "млрд", "трлн"];
	const exp = (Math.log10(value) / 3) | 0;

	if (exp === 0) return value.toString();

	const scaled = value / Math.pow(10, exp * 3);
	return `${scaled.toFixed(1)}${exp > 5 ? "e" + exp : types[exp]}`;
}
