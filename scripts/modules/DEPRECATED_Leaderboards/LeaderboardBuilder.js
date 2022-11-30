import { BlockLocation, world } from "@minecraft/server";
import { ThrowError, XA } from "xapi.js";

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

const lb = new XA.instantDB(world, "leaderboard");

// key: objective , value {"scores":[{"name": "smell of curry", "score": "10"},{"name": "leeshdsd", "score": "103"}], "location": {"x":10,"y":30,"z":50}}

const OrangeStyle = {
	color1: "",
	color2: "",
	top: "",
	nick: "",
	score: "",
	name: "",
};
const GreenStyle = {
	color1: "2",
	color2: "a",
	top: "2",
	nick: "6",
	score: "a",
	name: "6",
};
const GrayStyle = {
	color1: "7",
	color2: "f",
	top: "7",
	nick: "f",
	score: "7",
	name: "7",
};

export class LeaderboardBuilder {
	createLeaderboard(obj, x, y, z, dimension = "overworld", style) {
		let objective = world.scoreboard.getObjective(obj).displayName;
		const data = {
			scores: [],
			objective: obj,
			displayName: objective,
			style: style,
			location: { x: x, y: y, z: z, dimension: dimension },
		};
		lb.set(obj, data);
		let entity = world.getDimension(dimension).spawnEntity("f:t", new BlockLocation(x, y, z));
		entity.nameTag = "Updating...";
		entity.addTag("lb");
		entity.addTag("obj:" + obj);
	}
	/**
	 * Get the players faction
	 * @returns {boolean}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	removeLeaderboard(objective, x, y, z, dimension) {
		try {
			lb.delete(objective);
			let entitys = XA.Entity.getAtPos({ x, y, z }, dimension);
			if (entitys.length == 0) return false;
			entitys.find((entity) => entity.typeId == "f:t" && entity.hasTag("lb"))?.triggerEvent("kill");
			return true;
		} catch (error) {
			return false;
		}
	}
	/**
	 * Get the players faction
	 * @returns {boolean}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	shangeStyle(objective, style) {
		try {
			const data = lb.get(objective);
			data.style = style;
			lb.set(objective, data);
			return true;
		} catch (error) {
			return false;
		}
	}
	/**
	 * Get the players faction
	 * @returns {boolean}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	removeObj(objective) {
		try {
			lb.delete(objective);
			return true;
		} catch (error) {
			return false;
		}
	}
	/**
	 * Get the players faction
	 * @returns
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	updateLeaderboard(objective, x, y, z, dimension = "overworld", name, stylee) {
		try {
			let entity = XA.Entity.getAtPos({ x, y, z }, dimension)?.find(
				(entity) => entity.typeId == "f:t" && entity.hasTag("lb")
			);
			if (!entity) return;

			let sortedPlayers;
			const leaderboardScores = lb.get(objective).scores; // returns all scores of leaderboard
			if (leaderboardScores.length > 0) {
				// there are stored scores
				for (const player of world.getPlayers()) {
					const found = leaderboardScores.find((x) => x.name === player.name) ?? false;

					if (found) {
						// player already has score
						const index = leaderboardScores.indexOf(found);
						leaderboardScores[index].score = (XA.Entity.getScore(player, objective) ?? 0).toString(10);
					} else {
						leaderboardScores.push({
							name: `${player.name}`,
							score: `${XA.Entity.getScore(player, objective) ?? 0}`,
						});
					}
				}
			} else {
				// we need to create the first score
				for (const player of world.getPlayers()) {
					leaderboardScores.push({
						name: `${player.name}`,
						score: `${XA.Entity.getScore(player, objective) ?? 0}`,
					});
				}
			} // first leaderboard score is set
			const data = {
				scores: leaderboardScores,
				objective: objective,
				displayName: name,
				location: { x: x, y: y, z: z, dimension: dimension },
				style: stylee,
			};
			lb.set(objective, data);

			let style = GrayStyle;
			if (stylee == "gray") style = GrayStyle;
			if (stylee == "orange") style = OrangeStyle;

			sortedPlayers = leaderboardScores.sort((a, b) => b.score - a.score).slice(0, 10); // Cuts the array to only get top 10;

			let completedLeaderboard = ``;
			for (var i = 0; i < sortedPlayers.length; i++) {
				completedLeaderboard += `§${style.top}#${i + 1}§r §${style.nick}${sortedPlayers[i].name}§r §${
					style.score
				}${metricNumbers(parseInt(sortedPlayers[i].score))}§r\n`;
			}

			entity.nameTag = `§l§${style.name}${
				//§r
				name.charAt(0).toUpperCase() + name.slice(1)
			}\n§l${`§${style.color1}-§${style.color2}`.repeat(5)}§r\n${completedLeaderboard}`;
		} catch (error) {
			ThrowError(error);
		}
	}
	/**
	 * Get the players faction
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	hasLeaderboard(objective) {
		if (lb.get(objective)) {
			return true;
		} else return false;
	}
	/**
	 * Get the players faction
	 * @returns {string}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
	getLeaderboard(objective) {
		if (this.hasLeaderboard(objective)) {
			const leaderboard = lb.get(objective);
			const ObjectLeaderboard = JSON.parse(leaderboard);
			return ObjectLeaderboard;
		}
	}
	/**
	 * Get the players faction
	 * @example LeaderboardBuilder.getLeaderboardLocation(`money`);
	 */
	getLeaderboardLocation(objective) {
		if (this.hasLeaderboard(objective)) {
			const leaderboard = lb.get(objective);
			const ObjectLeaderboard = JSON.parse(leaderboard);
			return ObjectLeaderboard.location;
		}
	}
	/**
	 * Get the players faction
	 * @example LeaderboardBuilder.getLeaderboardLocation(`money`);
	 */
	getLeaderboardScores(objective) {
		if (this.hasLeaderboard(objective)) {
			const leaderboard = lb.get(objective);
			const ObjectLeaderboard = JSON.parse(leaderboard);
			return ObjectLeaderboard.scores;
		}
	}
	/**
	 * Get the players faction
	 * @param {string} player Player being added can be a made up name
	 * @param {string} objective Objective name you want to update
	 * @param {number} x x location of leaderboard
	 * @param {number} y y location of leaderboard
	 * @param {number} z z location of leaderboard
	 * @returns {boolean}
	 * @example LeaderboardBuilder.addPlayer(`money`, 10, 90 , 4, bob, 3844);
	 */
	addPlayer(objective, x, y, z, player, score) {
		const leaderboardScores = JSON.parse(lb.get(objective)).scores; // returns all scores of leaderboard
		leaderboardScores.push({
			name: `${player}`,
			score: `${score}`,
		});
		lb.set(
			`${objective}`,
			`{"scores":${JSON.stringify(
				leaderboardScores
			)}, "objective": "${objective}","location": {"x":${x},"y":${y},"z":${z}}}`
		);
		return true;
	}
	/**
	 * Get the players faction
	 * @returns {string}
	 * @example LeaderboardBuilder.getLeaderboard(`Smell of curry`);
	 */
}
export const LeaderboardBuild = new LeaderboardBuilder();
