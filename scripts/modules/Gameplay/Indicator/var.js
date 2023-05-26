import { Entity, Player } from "@minecraft/server";
import { ScoreboardDB } from "lib/Database/Scoreboard.js";
import { OBJECTIVES } from "../../Server/Objectives/var.js";

const pvpScore = "pvp";
OBJECTIVES.push({ id: pvpScore, watch: true });
export const PVP = new ScoreboardDB(pvpScore);

/**
 * @type {Record<string, number>}
 */
export const LOCKED_TITLES = {};

/**
 * Array of players who wouldn't get pvp lock
 * @type {string[]}
 */
export const NO_PVP_MODE = [];

/**
 * @type {((entity: Entity) => string | false)[]}
 */
export const NAME_MODIFIERS = [
	(entity) => {
		if (!(entity instanceof Player)) return false;

		return `\n${entity.name}`;
	},
];
