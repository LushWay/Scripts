import { world } from "@minecraft/server";
import { CONFIG } from "../../config.js";
import { XCommand } from "./Command.js";
import { commandNotFound, commandSyntaxFail, getChatAugments, noPerm, sendCallback } from "./utils.js";

world.events.beforeChat.subscribe((data) => {
	if (!data.message.startsWith(CONFIG.commandPrefix)) return; // This is not a command
	data.cancel = true;
	const [cmd, ...args] = getChatAugments(data.message, CONFIG.commandPrefix);
	const command = XCommand.COMMANDS.find((c) => c.data.name === cmd || c.data.aliases?.includes(cmd));
	if (!command) return commandNotFound(data.sender, cmd);
	if (!command.data?.requires(data.sender)) return noPerm(data.sender, command);
	/**
	 * Check Args/SubCommands for errors
	 * @type {XCommand[]}
	 */
	const verifiedCommands = [];

	/**
	 * @param {XCommand<any>} start
	 * @param {number} i
	 * @returns {string}
	 */
	function getArg(start, i) {
		if (start.children.length > 0) {
			const arg = start.children.find((v) => v.type.matches(args[i]).success || (!args[i] && v.type.optional));
			if (!arg && !args[i] && start.callback) return;
			if (!arg) return commandSyntaxFail(data.sender, command, args, i), "fail";
			if (!arg.data?.requires(data.sender)) return noPerm(data.sender, arg), "fail";
			verifiedCommands.push(arg);
			return getArg(arg, i + 1);
		}
	}

	if (getArg(command, 0)) return;
	sendCallback(args, verifiedCommands, data, command);
});
