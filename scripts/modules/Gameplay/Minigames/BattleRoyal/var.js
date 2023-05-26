import { Player } from "@minecraft/server";
import { EventSignal } from "lib/Class/Events.js";
import { Database } from "lib/Database/Rubedo.js";
import { XA } from "xapi.js";

export const BATTLE_ROYAL_EVENTS = {
	/** @type {EventSignal<Player>} */
	playerJoin: new EventSignal(),
	/** @type {EventSignal<Player>} */
	death: new EventSignal(),
};

/**
 * @type {Object<string, boolean>}
 */
export const quene = {};

export const BR_CONFIG = XA.WorldOptions("BattleRoyal", {
	gamepos: { desc: "x y", value: "", name: "Центр игры" },
	time: {
		desc: "Время игры в формате MM:SS (15:00)",
		value: "15:00",
		name: "Время игры",
	},
});

export const BR_DB = new Database("BattleRoyal");
