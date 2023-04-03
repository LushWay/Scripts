import { world } from "@minecraft/server";

world.say("§9┌ §fLoading...");
let loading = Date.now();

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

import { XItemDatabase } from "./lib/Database/Item.js";
import { emoji } from "./lib/Lang/emoji.js";
import { text } from "./lib/Lang/text.js";
import { XRunCommand } from "./lib/XRunCommand.js";

import { CONFIG } from "./config.js";
import { load_modules } from "./lib/Class/Module.js";
import { XUtils } from "./lib/Class/XUtils.js";
import { DisplayError } from "./lib/Setup/utils.js";

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

		region: new Database("region"),
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

export * from "./lib/Setup/loader.js";
export * from "./lib/Setup/roles.js";
export * from "./lib/Setup/timers.js";
export * from "./lib/Setup/utils.js";

/**
 * Importing file from dir of the project
 * @param {string} path
 */
globalThis.DIR_IMPORT = (path) => import(path);

world.events.playerJoin.subscribe(() => {
	if (Date.now() - loading < CONFIG.firstPlayerJoinTime) {
		XA.state.first_load = true;
	}
});

onWorldLoad(async () => {
	XA.state.world_loaded = true;

	Database.initAllTables();
	XA.state.db_loaded = true;

	await load_modules();
	XA.state.modules_loaded = true;

	XA.state.load_time = ((Date.now() - loading) / 1000).toFixed(2);
	if (!XA.state.first_load) world.say(`§9└ §fDone in ${XA.state.load_time}`);
	else world.say(`§fFirst loaded in ${XA.state.load_time}`);
}).catch(DisplayError);
