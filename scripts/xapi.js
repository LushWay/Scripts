import { Items, Player, system, world } from "@minecraft/server";
world.say("§9┌ §fLoading...");
let loading = true;

import { CONFIG } from "config.js";
import { EClass } from "./lib/Class/Entity.js";
import { stackParse } from "./lib/Class/Error.js";
import { EVClass } from "./lib/Class/Events.js";
import { CClass } from "./lib/Command/Command.js";
import { CDBClass, IDBClass } from "./lib/Database/index.js";
import { emoji } from "./lib/Lang/emoji.js";
import { parse } from "./lib/Lang/parser.js";
import { text } from "./lib/Lang/text.js";
import { Module } from "./lib/Module/creator.js";
import { load } from "./lib/Module/loader.js";
import * as tables from "./lib/oldDB/tables.js";
import { Timeout } from "./lib/Timeout.js";
import "./lib/types/prototypes.js";
import { Chat } from "./lib/Class/Chat.js";
import { wo } from "./lib/Class/Options.js";
import { O } from "./lib/Class/D.js";

/**==============================================
 * *                  Modules
 *
 * List of ALL modules that will be loaded
 *
 *=============================================**/
new Module("help");
new Module("Gui");
new Module("test");
new Module("Battle Royal");
new Module("Server");
new Module("BuildRegion");
new Module("Chat");

if (false) {
  new Module("Lmao");
  new Module("GameTest");
  new Module("Leaderboards");
  new Module("Airdrops");
  new Module("Chest GUI/src");
  if (!wo.QQ("import:cmd:wb:disable"))
    new Module("World Edit", { fileName: "WORLDindex.js" });
  if (Items.get("addon:akm")) new Module("Guns");
  new Module("migrate");
}

/*=============================================*/

export class XA {
  static events = EVClass;
  static Entity = EClass;
  static Chat = new Chat();
  static Lang = {
    lang: text,
    emoji: emoji,
    parse: parse,
  };
  static Command = CClass;
  static o = O;
  static OLDDB = tables;

  static instantDB = IDBClass;
  static cacheDB = CDBClass;
}

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
export function setTickInterval(callback, ticks) {
  return Timeout(ticks, callback, true);
}

/**
 *
 * @param {number} time
 * @returns
 */
export const sleep = (time) =>
  new Promise((resolve) => setTickTimeout(resolve, time));

/**
 * @param {function} callback
 * @param {number} ticks
 */
export function setTickTimeout(callback, ticks) {
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
        stack: e.stack,
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
