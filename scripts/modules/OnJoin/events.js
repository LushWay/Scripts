import { Player } from "@minecraft/server";
import { Subscriber } from "../../lib/Class/Events.js";

/** @type {Subscriber<Player>} */
const PlayerJoin = new Subscriber();

/** @type {Subscriber<Player>} */
const PlayerGuide = new Subscriber();

export const __EMITTERS = { PlayerJoin, PlayerGuide };

export const JOIN_EVENTS = {
	playerJoin: PlayerJoin.export,
	playerGuide: PlayerGuide.export,
};
