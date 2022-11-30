import { Player, world } from "@minecraft/server";

world.say("§9┌ §fLoading...");
// Var because it needs to be avaible before initialization
var loading = true;

// Custom prototypes
import "./lib/Types/prototypes.js";

// This need to be loaded before all another scripts
import "./lib/Setup/registryDynamicProperties.js";
import "./lib/Setup/watchdog.js";

// Some system stuff
import { CONFIG } from "./config.js";
import { stackParse } from "./lib/Class/Error.js";
import { DIMENSIONS } from "./lib/List/dimensions.js";

// X-API methods
import { XEntity } from "./lib/Class/Entity.js";
import { XCommand } from "./lib/Command/Command.js";
import { XCacheDatabase, XInstantDatabase } from "./lib/Database/DynamicProperties.js";
import { XItemDatabase } from "./lib/Database/Item.js";
import { emoji } from "./lib/Lang/emoji.js";
import { parse } from "./lib/Lang/parser.js";
import { text } from "./lib/Lang/text.js";
import { Timeout } from "./lib/Timeout.js";
import { XrunCommand } from "./lib/XrunCommand.js";

// Modules and undeletable scoreboards
import { load } from "./lib/Module/loader.js";
import "./lib/Setup/registryScore.js";
import "./modules/modules.js";

/**
 * Class with all X-API features
 */
export class XA {
	static Entity = XEntity;
	static runCommandX = XrunCommand;
	static Command = XCommand;

	static tables = {
		chests: new XInstantDatabase(world, "chests"),
		player: new XInstantDatabase(world, "player"),
		kits: new XInstantDatabase(world, "kits"),
		drops: new XInstantDatabase(world, "drop"),
		i: new XItemDatabase("items"),
	};
	static Lang = {
		lang: text,
		emoji: emoji,
		parse: parse,
	};

	static dimensions = DIMENSIONS;

	static instantDB = XInstantDatabase;
	static cacheDB = XCacheDatabase;

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

	const role = new XInstantDatabase(world, "roles").get(playerID);

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
	const DB = new XInstantDatabase(world, "roles");
	DB.set(player, role);
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
	const message = (isStr ? e ?? "Unknown" : e.message).replace(/\n/g, "");

	const type = isStr ? "CommandError" : e?.name ?? "Error";

	const c = loading ? "§9├§r " : "";
	const l = loading ? "§9│§r" : "";
	const s = `\n§f${stack}\n`.replace(/\n/g, `\n${l}`);

	const text = `§4${type}: §c${message}${s}`;

	CONFIG.console.errPath === "chat" ? world.say(c + text) : console.warn(text.cc());
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
export const sleep = (time) => new Promise((resolve) => setTickTimeout(() => resolve(), time));

/**
 * @param {Function} callback
 * @param {number} ticks
 * @param {string} [name]
 */
export function setTickInterval(callback, ticks = 0, name) {
	return Timeout(ticks, callback, true, name);
}

/**
 * @param {Function} callback
 * @param {number} ticks
 */
export function setTickTimeout(callback, ticks = 1) {
	return Timeout(ticks, callback, false, Date.now());
}

/**
 * @param {(cl: Player) => void} callback
 *  * @param {string} [name]
 * @param {number} ticks
 */
export function setPlayerInterval(callback, ticks = 0, name) {
	return Timeout(ticks, () => forPlayers(callback), true, name);
}

/**
 * @param {(cl: Player) => void} callback
 * @param {number} ticks
 */
export function setPlayerTimeout(callback, ticks = 1) {
	return Timeout(ticks, () => forPlayers(callback), false, Date.now());
}

/**
 * Importing file from dir of the project
 * @param {string} path
 */
export const DIR_IMPORT = (path) => import(path);

// Load modules
load().then(() => {
	world.say("§9└ §fDone.");
	loading = false;
});
