import { Player, system, world } from "@minecraft/server";

world.say("§9┌ §fLoading...");
// Var because it maybe need to be avaible before initialization
var loading = true;

// Custom prototypes
import "./lib/Types/prototypes.js";

// This need to be loaded before all another scripts
import { Database } from "./lib/Database/Entity.js";
import "./lib/Setup/watchdog.js";

// Some system stuff
import { CONFIG } from "./config.js";
import { stackParse } from "./lib/Class/Error.js";
import { DIMENSIONS } from "./lib/List/dimensions.js";

// X-API methods
import { XEntity } from "./lib/Class/Entity.js";
import { XCooldown } from "./lib/Class/XCooldown.js";
import { XOptions, XPlayerOptions } from "./lib/Class/XOptions.js";
import { XRequest } from "./lib/Class/XRequest.js";
import { XCommand } from "./lib/Command/Command.js";

import { emoji } from "./lib/Lang/emoji.js";
import { parse } from "./lib/Lang/parser.js";
import { text } from "./lib/Lang/text.js";
import { Timeout } from "./lib/Timeout.js";
import { XrunCommand } from "./lib/XrunCommand.js";

import { XItemDatabase } from "./lib/Database/Item.js";
// Modules and undeletable scoreboards
import { load } from "./lib/Module/loader.js";
import "./lib/Setup/registryScore.js";
import "./modules/import.js";
import { XUtils } from "./lib/Class/Xutils.js";

/**
 * Class with all X-API features
 */
export class XA {
	static Entity = XEntity;
	static runCommandX = XrunCommand;
	static Command = XCommand;
	static Cooldown = XCooldown;
	static Request = XRequest;
	static Utils = XUtils;

	static PlayerOptions = XPlayerOptions;
	static WorldOptions = XOptions;

	static tables = {
		/**
		 * Database to save server roles
		 * @type {Database<string, keyof typeof ROLES>}
		 */
		roles: new Database("roles"),

		/**
		 * Database to store any player data
		 * @type {Database<string, any>}
		 */
		player: new Database("player"),

		/** @type {Database<string, any>} */
		basic: new Database("basic"),

		region: new Database("region"),
		buildRegion: new Database("buildRegion"),

		// Trash
		/** @type {Database<string, string>} */
		chests: new Database("chests"),
		kits: new Database("kits"),
		drops: new Database("drop"),
		i: new XItemDatabase("items"),
	};
	static Lang = {
		lang: text,
		emoji: emoji,
		parse: parse,
	};

	static dimensions = DIMENSIONS;

	/** @type {{name?: string, id: string, watch?: boolean}[]} */
	static objectives = [];

	/** @protected */
	constructor() {}
}

/**
 * The roles that are in this server
 */
export const ROLES = {
	member: 0,
	admin: 1,
	moderator: 2,
	builder: 3,
};

/** @type {Record<keyof typeof ROLES, string>}} */
export const T_roles = {
	admin: "§cАдмин",
	builder: "§3Строитель",
	member: "§fУчастник",
	moderator: "§5Модератор",
};

/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {keyof typeof ROLES}
 * @example getRole("23529890")
 */
export function getRole(playerID) {
	if (playerID instanceof Player) playerID = playerID.id;

	const role = XA.tables.roles.get(playerID);

	if (!Object.keys(ROLES).includes(role)) return "member";
	return role;
}

/**
 * Sets the role of this player
 * @example setRole("342423452", "admin")
 * @param {Player | string} player
 * @param {keyof typeof ROLES} role
 * @returns {void}
 */
export function setRole(player, role) {
	if (player instanceof Player) player = player.id;
	XA.tables.roles.set(player, role);
}

/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {keyof typeof ROLES} role
 */
export function IS(playerID, role) {
	/** @type {(keyof typeof ROLES)[]} */
	let arr = ["moderator", "admin"];

	if (role === "admin") arr = ["admin"];
	if (role === "builder") arr.push("builder");

	return arr.includes(getRole(playerID));
}

/**
 * Parse and show error in chat
 * @param {{ message: string; stack?: string; name?: string} | string} e
 * @param {number} [deleteStack]
 * @param {string[]} [additionalStack]
 */
export function ThrowError(e, deleteStack = 0, additionalStack = []) {
	const isStr = typeof e === "string";
	const stack = stackParse(deleteStack + 1, additionalStack, isStr ? void 0 : e.stack);
	const message = (isStr ? e : e.message).replace(/\n/g, "");
	const type = isStr ? "CommandError" : e?.name ?? "Error";

	const text = `§4${type}: §c${message}\n§f${stack}\n`;
	console.warn(text);

	// try {
	// 	world.say(text); // CONFIG.console.errPath === "chat" ?  : console.warn(text.cc());
	// } catch (e) {
	// 	console.warn(isStr ? e : `${e.name} ${e.message}: ${e.stack}`);
	// }
	// console.warn(text.cc());
}

/**
 *
 * @param {number} C
 */
export function createWaiter(C) {
	let count = 0;
	return async () => {
		count++;
		if (count % C === 0) {
			await sleep(1);
			return count;
		}
	};
}

/**
 *
 * @param {(plr: Player) => void} callback
 */
export function forPlayers(callback) {
	for (const player of world.getPlayers()) if (typeof callback === "function") callback(player);
}

/**
 * @param {Object} target
 */
export function toStr(target, space = "  ", cw = "", funcCode = false, depth = 0) {
	const c = {
		function: {
			function: "§5",
			name: "§9",
			arguments: "§f",
			code: "§8",
			brackets: "§7",
		},

		nonstring: "§6",
		symbol: "§7",
		string: "§3",
	};

	if (depth > 10 || typeof target !== "object") return `${rep(target)}` ?? `${target}` ?? "{}";

	function rep(value) {
		switch (typeof value) {
			case "function":
				/**
				 * @type {string}
				 */
				let r = value.toString().replace(/[\n\r]/g, "");

				if (!funcCode) {
					const native = r.includes("[native code]");
					const code = native ? " [native code] " : "...";
					let isArrow = true;
					let name = "";

					if (r.startsWith("function")) {
						r = r.replace(/^function\s*/, "");
						isArrow = false;
					}

					if (/\w*\(/.test(r)) {
						name = r.match(/(\w*)\(/)[1];
						r = r.replace(name, "");
					}

					let args = "()",
						bracket = false,
						escape = false;

					for (const [i, char] of r.split("").entries()) {
						if (char === '"' && !escape) {
							bracket = !bracket;
						}

						if (char === "\\") {
							escape = true;
						} else escape = false;

						if (!bracket && char === ")") {
							args = r.substring(0, i);
							break;
						}
					}
					const cl = c.function;
					// function
					r = `${isArrow ? "" : `${cl.function}function `}`;
					// "name"
					r += `${cl.name}${name}`;
					// "(arg, arg)"
					r += `${cl.arguments}${args})`;
					// " => "  or  " "
					r += `${cl.function}${isArrow ? " => " : " "}`;
					// "{ code }"
					r += `${cl.brackets}{${cl.code}${code}${cl.brackets}}§r`;
				}

				value = r;

				break;

			case "object":
				if (Array.isArray(value)) break;

				if (visited.has(value)) {
					// Circular structure detected
					value = "{...}";
					break;
				}

				try {
					visited.add(value);
				} catch (e) {}

				const allInherits = {};

				for (const key in value)
					try {
						// value[key] can be ungettable
						allInherits[key] = value[key];
					} catch (e) {}

				value = allInherits;
				break;
			case "symbol":
				value = `${c.symbol}[Symbol.${value.description}]§r`;
				break;

			case "string":
				value = c.string + "'" + value + "'§r";
				break;

			default:
				value = c.nonstring + value + "§r";
				break;
		}
		return value;
	}

	// avoid Circular structure error
	const visited = new WeakSet();

	return JSON.stringify(target, (_, value) => rep(value), space)?.replace(/"/g, cw);
}

/**
 * Runs the given callback safly. If it throws any error it will be handled
 * @param {Function | (() => void | Promise)} func
 * @param {string} [type]
 * @param {string[]} [additionalStack]
 */
export async function handler(func, type = "Handled", additionalStack) {
	try {
		await func();
	} catch (e) {
		ThrowError(
			{
				message: `${e.name ? `${e.name}: §f` : ""}${e.message ?? e}`,
				name: type,
				stack: e?.stack,
			},
			1,
			additionalStack
		);
	}
}

/**
 * Returns a promise that will be resolved after given time
 * @param {number} time time in ticks
 * @returns {Promise<void>}
 */
export const sleep = (time) => new Promise((resolve) => setTickTimeout(() => resolve(), time, "sleep"));

/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickInterval(callback, ticks = 0, name) {
	return Timeout(ticks, callback, true, name);
}

/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setTickTimeout(callback, ticks = 1, name) {
	return Timeout(ticks, callback, false, name ?? Date.now());
}

/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerInterval(callback, ticks = 0, name) {
	return Timeout(ticks, () => forPlayers(callback), true, name);
}

/**
 * @param {(player: Player) => void} callback
 * @param {number} ticks
 * @param {string} name
 */
export function setPlayerTimeout(callback, ticks = 1, name) {
	return Timeout(ticks, () => forPlayers(callback), false, name ?? Date.now());
}

let WORLD_IS_LOADED = false;

/** @type {Function[]} */
const onLoad = [];

let s = system.runSchedule(async () => {
	try {
		await DIMENSIONS.overworld.runCommandAsync(`testfor @a`);
		system.clearRunSchedule(s);
		WORLD_IS_LOADED = true;
		onLoad.forEach((e) => e());
	} catch (error) {}
}, 1);

/**
 * Awaits till work load
 * @returns {Promise<void>}
 */
export async function awaitWorldLoad() {
	if (WORLD_IS_LOADED) return;
	return new Promise((resolve) => {
		onLoad.push(resolve);
	});
}

/**
 * Sends a callback once world is loaded
 * @param {() => void} callback  undefined
 * @returns {void}
 */
export function onWorldLoad(callback) {
	if (WORLD_IS_LOADED) return callback();
	onLoad.push(callback);
}

/**
 * Importing file from dir of the project
 * @param {string} path
 */
export const DIR_IMPORT = (path) => import(path);

// Load modules
awaitWorldLoad().then(async (e) => {
	await load();
	world.say("§9└ §fDone.");
	loading = false;
});
