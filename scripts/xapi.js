import { Player, system, world } from "@minecraft/server";
world.say("§9┌ §fLoading...");
let loading = true;

import "./lib/types/prototypes.js";
import { CONFIG } from "config.js";
import { Timeout } from "./lib/Timeout.js";
import { load } from "./lib/Module/loader.js";
import { Module } from "./lib/Module/creator.js";
import { EClass } from "./lib/Class/Entity.js";
import { text } from "./lib/Lang/text.js";
import { emoji } from "./lib/Lang/emoji.js";
import { parse } from "./lib/Lang/parser.js";
import { CClass } from "./lib/Command/Command.js";
import { stackParse } from "./lib/Class/Error.js";
import { CDBClass, IDBClass } from "./lib/Database/index.js";

/**==============================================
 * *                  Modules
 *
 * List of ALL modules that will be loaded
 *
 *=============================================**/
new Module("help", "HelpCommand");
new Module("gui");
new Module("test");
// new Module("error", "ErrorModule");
// new Module("test", "testFolder");
// new Module("migrate");

/*=============================================*/

export const XA = {
  Entity: EClass,
  Lang: {
    lang: text,
    emoji: emoji,
    parse: parse,
  },
  Command: CClass,
  o: world.getDimension("overworld"),

  instantDB: IDBClass,
  cacheDB: CDBClass,
};

system.events.beforeWatchdogTerminate.subscribe((d) => {
  d.cancel = true;
  ThrowError({
    message: "WatchDog terminate: §f" + d.terminateReason,
    stack: "Script\n",
  });
});

/**
 * @param {function} callback
 * @param {number} ticks
 */
export function setInterval(callback, ticks) {
  return Timeout(ticks, callback, true);
}
/**
 * @param {function} callback
 * @param {number} ticks
 */
export function setTimeout(callback, ticks) {
  return Timeout(ticks, callback);
}

/**
 * @param {(cl: Player) => void} callback
 * @param {number} ticks
 */
export function setPlayerInterval(callback, ticks) {
  return Timeout(ticks, () => forPlayers(callback), true);
}

/**
 * @param {(cl: Player) => void} callback
 * @param {number} ticks
 */
export function setPlayerTimeout(callback, ticks) {
  return Timeout(ticks, () => forPlayers(callback));
}

/**
 * @param {{ message: string; stack?: string; name?: string}} e
 * @param {number} deleteStack
 */
export function ThrowError(e, deleteStack = 0) {
  const stack = stackParse(deleteStack + 1, e.stack),
    message = e.message,
    type = e.name ?? "Error";

  const c = loading ? "§9├ " : "",
    ss = stack,
    s = `${ss}\n`.replace(
      //${ss.match(/.*\\n/g) ? ss : "\n" + ss}
      /\n/g,
      `\n${loading ? "§9│§r" : ""}`
    );

  CONFIG.console.errPath === "chat"
    ? world.say(`${c}§4${type}: §c${message} §f${s}`)
    : console.warn(`${type}: ${message} ${s}`);
}

/**
 * @param {string} message
 * @param {string} [type]
 */
export function Log(message, type) {
  CONFIG.console.logPath === "chat"
    ? world.say(
        `${!type && message.startsWith("{") ? "" : "§7> "}${
          type ? `[${type}] ` : ""
        }§f${message}`
      )
    : CONFIG.console.logPath === "console" &&
      console.warn(`${type ? `[${type}]` : ""} §f${message}`);
}

/**
 * @param {(plr: Player) => void} clb
 */
export function forPlayers(clb) {
  for (const player of world.getPlayers())
    if (typeof clb === "function") clb(player);
}

/**
 * @param {Object} obj
 */
export function toStr(obj, space = "  ", cw = "", funcCode = false, depth = 0) {
  if (depth > 10) return obj ?? "{}";

  // avoid Circular structure error
  const visited = new WeakSet();

  return JSON.stringify(
    obj,
    (_, value) => {
      switch (typeof value) {
        case "function":
          // const reg = /(.*\(.+\)\s*=?>?\s*\{).+\}/g;
          /**
           * @type {String}
           */
          let r = //reg.test(value) ?
            value.toString().replace(/[\n\r]/g, "");
          // : "function() { }";

          if (!funcCode) {
            const code = r.includes("[native code]") ? " [native code] " : " ";

            // world.say("§7" + _ + "§8: " + r);

            // Delete "function name(args) { >>code<< }" part
            r = r.replace(
              /((?:function)?(?:\s*\w*)\((?:\w*\s*(?:=\s*"[^"]*")?,?\s*)+\)\s*(?:=>\s*)?)\{.*\}/,
              `$1${code}}`
            );

            // world.say("§7" + _ + "§8: " + r);
          }

          value = r;

          break;

        case "object":
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
      }
      return value;
    },
    space
  ).replace(/"/g, cw);
}

/**
 *
 * @param {() => void | Promise} func
 * @param {any} type
 */
export async function handler(func, type) {
  const er = (e) =>
    ThrowError(
      {
        message: `${e.name}: §f${e.message ?? e}`,
        name: type,
      },
      1
    );
  try {
    const res = func();

    if (res && res.catch) res.catch(er), await res;
  } catch (e) {
    er(e);
  }
}

/**
 *
 * @param {string} path
 * @returns {Promise<Object>}
 */
export const __CORE_IMPORT__ = async (path) => import(path);
/*      ^ End of export parts ^
---------------------------------------*/

// Load modules
load().then(() => {
  world.say("§9└ §fDone.");
  loading = false;
});
