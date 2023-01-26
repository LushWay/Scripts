import { Entity, world } from "@minecraft/server";
import { setTickInterval, XA } from "xapi.js";
import { Database } from "../../lib/Database/Entity.js";
import "./commands.js";

/**
 * @typedef {{
 *   style: keyof typeof STYLES;
 *   objective: string;
 *   location: Vector3;
 *   dimension: string;
 * }} LB
 */

const LEADERBOARD_TAG = "LEADERBOARD";
const LEADERBOARD_ID = "f:t";
const STYLES = {
	gray: {
		color1: "7",
		color2: "f",
		top: "7",
		nick: "f",
		score: "7",
		name: "7",
	},
	orange: {
		color1: "",
		color2: "",
		top: "",
		nick: "",
		score: "",
		name: "",
	},
	green: {
		color1: "7",
		color2: "f",
		top: "7",
		nick: "f",
		score: "7",
		name: "7",
	},
};

/**
 * @type {Database<string, LB>}
 */
export const LB_DB = new Database("leaderboard");
export const LeaderboardBuild = {
	/**
	 *
	 * @param {string} objective
	 * @param {Vector3} location
	 * @param {string} dimension
	 * @param {keyof typeof STYLES} style
	 */
	createLeaderboard(objective, location, dimension = "overworld", style = "green") {
		const data = {
			style,
			objective,
			location,
			dimension,
		};
		LB_DB.set(objective, data);
		let entity = world.getDimension(dimension).spawnEntity(LEADERBOARD_ID, XA.Utils.vecToBlockLocation(location));
		entity.nameTag = "Updating...";
		entity.addTag(LEADERBOARD_TAG);
	},
	/**
	 * Get the players faction
	 * @returns {boolean}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	removeLeaderboard(objective, x, y, z, dimension) {
		LB_DB.delete(objective);
		let entitys = XA.Entity.getAtPos({ x, y, z }, dimension);
		if (entitys.length == 0) return false;
		entitys.find(isLeaderboard)?.triggerEvent("kill");
		return true;
	},
	/**
	 *
	 * @param {string} objective
	 * @param {string} style
	 */
	changeStyle(objective, style) {
		const { data, save } = LB_DB.work(objective);
		if (!XA.Utils.isKeyof(style, STYLES)) return;
		data.style = style;
		save();
	},
	/**
	 * @param {LB} data
	 */
	updateLeaderboard(data) {
		const entity = XA.Entity.getAtPos(data.location, data.dimension)?.find(isLeaderboard);
		if (!entity) return LB_DB.delete(data.objective);

		const scoreboard = world.scoreboard.getObjective(data.objective);
		const name = scoreboard.displayName;
		const style = STYLES[data.style];

		let completedLeaderboard = ``;
		for (const [i, scoreInfo] of scoreboard.getScores().entries()) {
			completedLeaderboard += `§${style.top}#${i + 1}§r §${style.nick}${scoreInfo.participant.displayName}§r`;
			completedLeaderboard += `§${style.score}${metricNumbers(scoreInfo.score)}§r\n`;
		}

		entity.nameTag = `§l§${style.name}${
			//§r
			name.charAt(0).toUpperCase() + name.slice(1)
		}\n§l${`§${style.color1}-§${style.color2}`.repeat(5)}§r\n${completedLeaderboard}`;
	},
};

setTickInterval(
	() => {
		if (!LB_DB || LB_DB.keys().length < 0) return;
		for (let leaderboard of LB_DB.values()) {
			LeaderboardBuild.updateLeaderboard(leaderboard);
		}
	},
	10,
	"leaderboardsInterval"
);

/**
 * This will display in text in thousands, millions and etc... For ex: "1400 -> "1.4k", "1000000" -> "1M", etc...
 * @param {number} value The number you want to convert
 * @returns {string}
 * @example metricNumbers(15000);
 */
function metricNumbers(value) {
	const types = ["", "к", "млн", "млрд", "трлн"];
	const exp = (Math.log10(value) / 3) | 0;

	if (exp === 0) return value.toString();

	const scaled = value / Math.pow(10, exp * 3);
	return `${scaled.toFixed(1)}${exp > 5 ? " " + types[exp] : "e" + exp}`;
}

/**
 *
 * @param {Entity} entity
 */
function isLeaderboard(entity) {
	return entity && entity.typeId === LEADERBOARD_ID && entity.hasTag(LEADERBOARD_TAG);
}
