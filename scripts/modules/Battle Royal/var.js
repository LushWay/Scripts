import { Player } from "@minecraft/server";
import { Subscriber } from "../../lib/Class/XEvents.js";
import { Database } from "../../lib/Database/Rubedo.js";
import { XA } from "../../xapi.js";

/** @type {Subscriber<Player>} */
const playerJoinQuene = new Subscriber();

/** @type {Subscriber<Player>} */
const playerDeath = new Subscriber();

export const __BR_EMITTERS = { playerDeath, playerJoinQuene };

export const BATTLE_ROYAL_EVENTS = {
	playerJoin: playerJoinQuene.export,
	death: playerDeath.export,
};

/**
 * @type {Object<string, boolean>}
 */
export const quene = {};

export const BR_CONFIG = XA.WorldOptions("BattleRoyal", {
	pos: { desc: "x y z", value: "" },
	gamepos: { desc: "x y", value: "" },
	time: { desc: "Время игры в формате MM:SS (15:00)", value: "15:00" },
});

export const BR_DB = new Database("BattleRoyal");
