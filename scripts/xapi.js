import { system, world } from "@minecraft/server";

// This need to be loaded before all another scripts
import "./lib/Setup/watchdog.js";

import "./lib/Setup/prototypes.js";

import { CONFIG } from "./config.js";
import { EventLoader } from "./lib/Class/Events.js";
import { XCommand } from "./lib/Command/index.js";
import { Database } from "./lib/Database/Rubedo.js";
import { emoji } from "./lib/Lang/emoji.js";
import { text } from "./lib/Lang/text.js";
import { util } from "./lib/Setup/utils.js";

world.say("§9┌ §fLoading...");
let loading = Date.now();

/**
 * Class because variable hoisting
 */
export class XA {
	static Lang = {
		lang: text,
		emoji: emoji,
	};

	static tables = {
		/**
		 * Database to store any player data
		 * @type {Database<string, any>}
		 */
		player: new Database("player"),
	};

	static afterEvents = {
		modulesLoad: new EventLoader(),
		worldLoad: new EventLoader(),
	};

	static state = {
		firstLoad: false,
		modulesLoaded: false,
		loadTime: "",
	};
}

globalThis.XA = XA;
globalThis.XCommand = XCommand;

// Class
export * from "./lib/Class/Action.js";
export * from "./lib/Class/Cooldown.js";
export * from "./lib/Class/Entity.js";
export * from "./lib/Class/Events.js";
export * from "./lib/Class/Options.js";
export * from "./lib/Class/Utils.js";
// Command
export * from "./lib/Command/index.js";
// Database
export * from "./lib/Database/Default.js";
export * from "./lib/Database/Inventory.js";
export * from "./lib/Database/Rubedo.js";
export * from "./lib/Database/Scoreboard.js";
// Form
export * from "./lib/Form/ActionForm.js";
export * from "./lib/Form/MessageForm.js";
export * from "./lib/Form/ModelForm.js";
export * from "./lib/Form/utils.js";
// Setup
export * from "./lib/Setup/Extensions/system.js";
export * from "./lib/Setup/prototypes.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/utils.js";

world.afterEvents.playerJoin.subscribe((player) => {
	if (
		Date.now() - loading < CONFIG.firstPlayerJoinTime &&
		player.playerId === "-4294967285"
	) {
		XA.state.firstLoad = true;
	}
});

system.run(async function waiter() {
	const entities = await world.overworld.runCommandAsync(`testfor @e`);
	if (entities.successCount < 1) {
		// No entity found, we need to re-run this...
		return system.run(waiter);
	}

	console.log("WORLD LOADED, X-API STARTED");
	EventLoader.load(XA.afterEvents.worldLoad);
});

XA.afterEvents.worldLoad.subscribe(async () => {
	let errorName = "DatabaseError";
	try {
		await Database.initAllTables();

		errorName = "LoadingError";
		await import("./modules/import.js");

		EventLoader.load(XA.afterEvents.modulesLoad);

		if (world.getAllPlayers().find((e) => e.id === "-4294967285")) {
			util.settings.BDSMode = true;
		}

		XA.state.loadTime = ((Date.now() - loading) / 1000).toFixed(2);

		if (!XA.state.firstLoad) world.say(`§9└ §fDone in ${XA.state.loadTime}`);
		else world.say(`§fFirst loaded in ${XA.state.loadTime}`);
	} catch (e) {
		util.error(e, { errorName });
	}
});
