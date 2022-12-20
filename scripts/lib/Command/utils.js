import { BeforeChatEvent, Player, Vector } from "@minecraft/server";
import { handle } from "xapi.js";
import { CONFIG } from "../../config.js";
import { LiteralArgumentType, LocationArgumentType } from "./ArgumentTypes.js";
import { CommandContext } from "./Callback.js";
import { __COMMANDS__ } from "./index.js";
import { inaccurateSearch } from "./suggestions.js";

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
		.replace(/([~^][^~^\s]*)/g, "$1 ")
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

	const cmds = new Set();

	for (const c of __COMMANDS__) {
		cmds.add(c.data.name);
		if (c.data.aliases?.length > 0) {
			c.data.aliases.forEach((e) => cmds.add(e));
		}
	}
	let search = inaccurateSearch(command, [...cmds.values()]);

	const options = {
		minMatchTriggerValue: 0.5,
		maxDifferenceBeetwenSuggestions: 0.15,
		maxSuggestionsCount: 3,
	};

	if (!search[0] || (search[0] && search[0][1] < options.minMatchTriggerValue)) return;

	const suggest = (a) => `§f${a[0]} §7(${(a[1] * 100).toFixed(0)}%%)§c`;
	let suggestion = "§cВы имели ввиду " + suggest(search[0]);
	let firstValue = search[0][1];
	search = search
		.filter((e) => firstValue - e[1] <= options.maxDifferenceBeetwenSuggestions)
		.slice(1, options.maxSuggestionsCount);

	for (const [i, e] of search.entries()) suggestion += `${i + 1 === search.length ? " или " : ", "}${suggest(e)}`;

	player.tell(suggestion + "§c?");
}

/**
 * Sends a command not found message to a player
 * @param {Player} player  player to send message to
 * @param {import("./Command.js").XCommand} command
 * @returns {void}
 */
export function noPerm(player, command) {
	player.tell({
		rawtext: [
			{
				text: command.data.invaildPermission
					? command.data.invaildPermission
					: `§cУ вас нет разрешения для использования команды §f${command.data.name}`,
			},
		],
	});
}

/**
 * Sends a syntax failure message to player
 * @param {Player} player  undefined
 * @param {import("./Command.js").XCommand} command  undefined
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
					`${CONFIG.commandPrefix}${command.data.name} ${args.slice(0, i).join(" ")}`,
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
 * @param {{ location: Vector3; viewVector: Vector }} a1
 * @returns {{x: number, y: number, z: number}}
 */
export function parseLocationAugs([x, y, z], { location, viewVector }) {
	if (typeof x !== "string" || typeof y !== "string" || typeof z !== "string") return null;
	const locations = [location.x, location.y, location.z];
	const viewVectors = [viewVector.x, viewVector.y, viewVector.z];
	const a = [x, y, z].map((arg) => {
		const r = parseFloat(arg?.replace(/^[~^]/g, ""));
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
 * @param {import("./Command.js").XCommand<any>[]} args args to use
 * @param {BeforeChatEvent} event
 * @param {import("./Command.js").XCommand<any>} baseCommand
 */
export function sendCallback(cmdArgs, args, event, baseCommand) {
	const lastArg = args[args.length - 1] ?? baseCommand;
	const argsToReturn = [];
	for (const [i, arg] of args.entries()) {
		if (arg.type.name.endsWith("*")) continue;
		if (arg.type instanceof LocationArgumentType) {
			argsToReturn.push(
				parseLocationAugs([cmdArgs[i], cmdArgs[i + 1], cmdArgs[i + 2]], event.sender) ?? event.sender.location
			);
			continue;
		}
		if (arg.type instanceof LiteralArgumentType) continue;
		argsToReturn.push(arg.type.matches(cmdArgs[i]).value ?? cmdArgs[i]);
	}
	if (typeof lastArg.callback !== "function") return event.sender.tell("§cУпс, эта команда пока не работает.");
	handle(() => lastArg.callback(new CommandContext(event, cmdArgs), ...argsToReturn), "Command");
}
