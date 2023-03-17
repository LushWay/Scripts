import { world } from "@minecraft/server";
import { setTickInterval, XA } from "xapi.js";
import { Database } from "../../lib/Database/Rubedo.js";
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
	 * @param {Vector3} loc
	 * @param {string} dimension
	 */
	get(loc, dimension) {
		return XA.Entity.getAtPos(loc, dimension).find(
			(entity) =>
				entity &&
				entity.typeId === LEADERBOARD_ID &&
				entity.hasTag(LEADERBOARD_TAG)
		);
	},
	/**
	 *
	 * @param {string} objective
	 * @param {Vector3} location
	 * @param {string} dimension
	 * @param {keyof typeof STYLES} style
	 */
	createLeaderboard(
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
		LB_DB.set(objective, data);
		let entity = world
			.getDimension(dimension)
			.spawnEntity(LEADERBOARD_ID, XA.Utils.floorVector(location));

		entity.nameTag = "Updating...";
		entity.addTag(LEADERBOARD_TAG);
	},
	/**
	 * Removing the leaderboard.
	 * @param {string} objective
	 * @param {Vector3} loc
	 * @param {string} dimension
	 * @returns
	 */
	removeLeaderboard(objective, loc, dimension) {
		LB_DB.delete(objective);
		let entity = LeaderboardBuild.get(loc, dimension);
		if (!entity) return false;

		entity.triggerEvent("kill");
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
		const entity = LeaderboardBuild.get(data.location, data.dimension);
		if (!entity) return LB_DB.delete(data.objective);

		const scoreboard = world.scoreboard.getObjective(data.objective);
		const dname = scoreboard.displayName;
		const name = dname.charAt(0).toUpperCase() + dname.slice(1);
		const style = STYLES[data.style];
		const filler = `§${style.color1}-§${style.color2}`.repeat(5);

		let leaderboard = ``;
		for (const [i, scoreInfo] of scoreboard.getScores().entries()) {
			const { top: t, nick: n, score: s } = style;

			leaderboard += `§${t}#${i + 1}§r §${n}`;
			leaderboard += `${scoreInfo.participant.displayName}§r`;
			leaderboard += `§${s}${toMetricNumbers(scoreInfo.score)}§r\n`;
		}

		entity.nameTag = `§l§${style.name}${name}\n§l${filler}§r\n${leaderboard}`;
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
function toMetricNumbers(value) {
	const types = ["", "к", "млн", "млрд", "трлн"];
	const exp = (Math.log10(value) / 3) | 0;

	if (exp === 0) return value.toString();

	const scaled = value / Math.pow(10, exp * 3);
	return `${scaled.toFixed(1)}${exp > 5 ? " " + types[exp] : "e" + exp}`;
}
