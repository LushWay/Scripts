import { CommandResult, world } from "@minecraft/server";
import { ThrowError, toStr } from "xapi.js";
import { DIMENSIONS } from "./List/dimensions.js";

/**
 * @typedef {{showOutput?: boolean; showError?: boolean; dimension?: "overworld" | "nether" | "the_end"}} ICommandOptions
 */

/**
 * Asynchornosly runs a command
 * @param {string} command Command to run
 * @param {ICommandOptions} [options] Options
 * @returns {Promise<CommandResult>}
 */
export async function XrunCommand(command, options) {
	try {
		const result = await DIMENSIONS[options?.dimension ?? "overworld"].runCommandAsync(command);
		if (options?.showOutput) world.say(toStr(result));
		return result;
	} catch (error) {
		if (options?.showError) ThrowError(error);
		return { successCount: 0 };
	}
}
