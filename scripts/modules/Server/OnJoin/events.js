import { Player } from "@minecraft/server";
import { Subscriber } from "lib/Class/XEvents.js";

/** @type {Subscriber<Player>} */
const PlayerJoin = new Subscriber();

/** @type {Subscriber<Player>} */
const PlayerGuide = new Subscriber();

/** @type {Subscriber<Player>} */
const PlayerClosedGuide = new Subscriber();

export const __JOIN_EMITTERS = { PlayerJoin, PlayerGuide, PlayerClosedGuide };

export const JOIN_EVENTS = {
	playerJoin: PlayerJoin.export,
	playerGuide: PlayerGuide.export,
	playerClosedGuide: PlayerClosedGuide.export,
};
