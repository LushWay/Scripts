import { world } from "@minecraft/server";

// This need to be loaded before all another scripts
import "./lib/Setup/watchdog.js";

import "./lib/Setup/prototypes.js";

import { onWorldLoad } from "./lib/Setup/loader.js";

// X-API methods
import { XEntity } from "./lib/Class/Entity.js";
import { XCooldown } from "./lib/Class/XCooldown.js";
import { XOptions, XPlayerOptions } from "./lib/Class/XOptions.js";
import { XRequest } from "./lib/Class/XRequest.js";
import { XCommand } from "./lib/Command/index.js";
import { Database } from "./lib/Database/Rubedo.js";

import { XRunCommand } from "./lib/Class/XRunCommand.js";
import { XItemDatabase } from "./lib/Database/Item.js";
import { emoji } from "./lib/Lang/emoji.js";
import { text } from "./lib/Lang/text.js";

import { CONFIG } from "./config.js";
import { XUtils } from "./lib/Class/XUtils.js";
import { loadModules } from "./modules/import.js";
import { DisplayError } from "./xapi.js";

world.say("§9┌ §fLoading...");
let loading = Date.now();

/**
 * Class with all X-API features
 */
export class XA {
	static Entity = XEntity;
	static runCommandX = XRunCommand;
	static Command = XCommand;
	static Cooldown = XCooldown;
	static Request = XRequest;
	static Utils = XUtils;

	static PlayerOptions = XPlayerOptions;
	static WorldOptions = XOptions;

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

		buildRegion: new Database("buildRegion"),

		i: new XItemDatabase("items"),
	};

	static state = {
		first_load: false,
		world_loaded: false,
		db_loaded: false,
		modules_loaded: false,
		load_time: "",
	};

	/** @protected */
	constructor() {}
}

globalThis.XA = XA;

export * from "./lib/Setup/Extensions/system.js";
export * from "./lib/Setup/loader.js";
export * from "./lib/Setup/prototypes.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/utils.js";

world.events.playerJoin.subscribe(() => {
	if (Date.now() - loading < CONFIG.firstPlayerJoinTime) {
		XA.state.first_load = true;
	}
});

onWorldLoad(
	async () => {
		XA.state.world_loaded = true;

		Database.initAllTables();
		XA.state.db_loaded = true;
		await nextTick;

		await loadModules();
		XA.state.modules_loaded = true;

		XA.state.load_time = ((Date.now() - loading) / 1000).toFixed(2);

		if (!XA.state.first_load) world.say(`§9└ §fDone in ${XA.state.load_time}`);
		else world.say(`§fFirst loaded in ${XA.state.load_time}`);
	},
	(fn) => fn().catch((e) => DisplayError(e, { errorName: "X-API-ERR" }))
);
