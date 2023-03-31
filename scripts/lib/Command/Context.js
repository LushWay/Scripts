import { BeforeChatEvent, Player } from "@minecraft/server";
import { XCommand } from "./index.js";

export class CommandContext {
	/**
	 * @type {BeforeChatEvent}
	 */
	data;

	/**
	 * @type {Player}
	 */
	sender;

	/**
	 * @type {string[]}
	 */
	args;

	/**
	 * @type {XCommand}
	 */
	command;

	/**
	 * Returns a commands callback
	 * @param {BeforeChatEvent} data chat data that was used
	 * @param {string[]} args
	 * @param {XCommand} command
	 * @param {string} rawInput
	 */
	constructor(data, args, command, rawInput) {
		this.data = data;
		this.sender = data.sender;
		this.command = command;
		this.args = args;
		this.input = rawInput;
	}
	/**
	 * Replys to the sender of a command callback
	 * @param {any} text Message or a lang code
	 * @example ctx.reply('Hello World!');
	 */
	reply(text) {
		this.sender.tell(text + "");
	}
	/**
	 * Replys to the sender of a command callback
	 * @param {any} errorText Message or a lang code
	 * @example ctx.reply('Hello World!');
	 */
	error(errorText) {
		this.sender.tell(`§c${errorText}`);
	}
}
