import { world } from "@minecraft/server";

// This need to be loaded before all another scripts
import "./lib/Setup/watchdog.js";

import "./lib/Setup/prototypes.js";

import { CONFIG } from "./config.js";
import { EventSignal } from "./lib/Class/Events.js";
import { XCommand } from "./lib/Command/index.js";
import { Database } from "./lib/Database/Rubedo.js";
import { emoji } from "./lib/Lang/emoji.js";
import { text } from "./lib/Lang/text.js";
import { onWorldLoad } from "./lib/Setup/loader.js";
import { util } from "./lib/Setup/utils.js";
import { loadModules } from "./modules/import.js";

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

	static state = {
		first_load: false,
		modules_loaded: false,
		afterModulesLoad: new EventSignal(),
		load_time: "",
	};

	/** @protected */
	constructor() {}
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
export * from "./lib/Setup/loader.js";
export * from "./lib/Setup/prototypes.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/utils.js";

world.afterEvents.playerJoin.subscribe(() => {
	if (Date.now() - loading < CONFIG.firstPlayerJoinTime) {
		XA.state.first_load = true;
	}
});

onWorldLoad(
	async () => {
		Database.initAllTables();
		await nextTick;

		await loadModules();
		XA.state.modules_loaded = true;
		EventSignal.emit(XA.state.afterModulesLoad, {});

		XA.state.load_time = ((Date.now() - loading) / 1000).toFixed(2);

		if (!XA.state.first_load) world.say(`§9└ §fDone in ${XA.state.load_time}`);
		else world.say(`§fFirst loaded in ${XA.state.load_time}`);
	},
	(fn) => fn().catch((e) => util.error(e, { errorName: "X-API-ERR" }))
);
