import { BeforeChatEvent, Player, Location, Vector } from "@minecraft/server";
import { CONFIG } from "config.js";
import { handler } from "xapi.js";
import { LiteralArgumentType, LocationArgumentType } from "./ArgumentTypes.js";
import { CommandCallback } from "./Callback.js";
import { __COMMANDS__ } from "./index.js";

/**
 * Returns a Before chat events augments
 * @example this.getChatAugments(BeforeChatEvent)
 * @param {string} message
 * @param {string} prefix
 * @returns {string[]}
 */
export function getChatAugments(message, prefix) {
  return message
    .slice(prefix.length)
    .trim()
    .match(/"[^"]+"|[^\s]+/g)
    .map((e) => e.replace(/"(.+)"/, "$1").toString());
}

/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
 * @param {string} command
 * @returns {void}
 */
export function commandNotFound(player, command) {
  player.tell({
    rawtext: [
      {
        text: `§c`,
      },
      {
        translate: `commands.generic.unknown`,
        with: [`${command}`],
      },
    ],
  });

  if (!command) return;

  let cmds = [];

  const add = (e) => {
    if (!cmds.includes(e)) cmds.push(e);
  };

  for (const c of __COMMANDS__) {
    add(c.data.name);
    if (c.data.aliases?.length > 0) {
      c.data.aliases.forEach((e) => add(e));
    }
  }
  let a = cmds.inaccurateSearch(command);

  if (!a[0] || (a[0] && a[0][1] < 0.5)) return;

  const ig = (a) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%)§c`;
  let ans = "§cВы имели ввиду " + ig(a[0]),
    s = a[0][1];
  a = a.filter((e) => s - e[1] <= 0.15);
  for (const [i, e] of a.slice(1).entries())
    ans += `${i + 2 === a.length ? " или " : ", "}${ig(e)}`;

  player.tell(ans + "§c?");
}

/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
 * @param {import("./Command.js").CClass} command
 * @returns {void}
 */
export function noPerm(player, command) {
  player.tell({
    rawtext: [
      {
        text: command.data.invaildPermission
          ? command.data.invaildPermission
          : `§cYou do not have perrmission to use "${command.data.name}"`,
      },
    ],
  });
}

/**
 * Sends a syntax failure message to player
 * @param {Player} player  undefined
 * @param {import("./Command.js").CClass} command  undefined
 * @param {string[]} args  undefined
 * @param {number} i  undefined
 * @returns {void}
 */
export function commandSyntaxFail(player, command, args, i) {
  player.tell({
    rawtext: [
      {
        text: `§c`,
      },
      {
        translate: `commands.generic.syntax`,
        with: [
          `${CONFIG.commandPrefix}${command.data.name} ${args
            .slice(0, i)
            .join(" ")}`,
          args[i] ?? " ",
          args.slice(i + 1).join(" "),
        ],
      },
    ],
  });
}

/**
 * Returns a location of the inputed aguments
 * @example parseLocationAugs(["~1", "3", "^7"], { location: [1,2,3] , viewVector: [1,2,3] })
 * @param {[x: string, y: string, z: string]} a0
 * @param {{ location: Location; viewVector: Vector }} a1
 * @returns {{x: number, y: number, z: number}}
 */
export function parseLocationAugs([x, y, z], { location, viewVector }) {
  if (!x || !y || !x) return null;
  const locations = [location.x, location.y, location.z];
  const viewVectors = [viewVector.x, viewVector.y, viewVector.z];
  const a = [x, y, z].map((arg) => {
    const r = parseInt(arg.replace(/\D/g, ""));
    return isNaN(r) ? 0 : r;
  });
  const b = [x, y, z].map((arg, index) => {
    return arg.includes("~")
      ? a[index] + locations[index]
      : arg.includes("^")
      ? a[index] + viewVectors[index]
      : a[index];
  });
  return { x: b[0], y: b[1], z: b[2] };
}

/**
 * Sends a callback back to the command
 * @param {string[]} cmdArgs the args that the command used
 * @param {import("./Command.js").CClass<any>[]} args args to use
 * @param {BeforeChatEvent} event
 * @param {import("./Command.js").CClass<any>} baseCommand
 */
export function sendCallback(cmdArgs, args, event, baseCommand) {
  const lastArg = args[args.length - 1] ?? baseCommand;
  const argsToReturn = [];
  for (const [i, arg] of args.entries()) {
    if (arg.type.name.endsWith("*")) continue;
    if (arg.type instanceof LocationArgumentType) {
      argsToReturn.push(
        parseLocationAugs(
          [cmdArgs[i], cmdArgs[i + 1], cmdArgs[i + 2]],
          event.sender
        )
      );
      continue;
    }
    if (arg.type instanceof LiteralArgumentType) continue;
    argsToReturn.push(arg.type.matches(cmdArgs[i]).value ?? cmdArgs[i]);
  }
  handler(
    () => lastArg.callback(new CommandCallback(event), ...argsToReturn),
    "Command"
  );
}

/**
 * @param {import("./Command.js").CClass} command
 * @returns {string[]}
 */
export function getUsage(command) {
  return [
    getType(command.parent),
    getType(command),
    ...command.children.map(getType),
  ];
}

/**
 *
 * @param {import("./Command.js").CClass} o
 * @returns
 */
function getType(o) {
  const t = o.type,
    q = t.optional;
  return t.typeName === "literal"
    ? `${q ? "§7" : "§f"}${t.name}`
    : `${
        q
          ? `§7[${o.type.name}: §7${o.type.typeName}§7]`
          : `§6<${o.type.name}: §6${o.type.typeName}§6>`
      }`;
}
