import { world } from "@minecraft/server";
import { DisplayError } from "xapi.js";
import { DIMENSIONS } from "./List/dimensions.js";

/**
 * @typedef {{
 *   showOutput?: boolean;
 *   showError?: boolean;
 *   dimension?: "overworld" | "nether" | "the_end"
 * }} ICommandOptions
 */

/**
 * Asynchornosly runs a command
 * @param {string} command Command to run
 * @param {ICommandOptions} [options] Options
 * @returns {Promise<number>}
 */
export async function XRunCommand(command, options = {}) {
	try {
		const result = await DIMENSIONS[
			options.dimension ?? "overworld"
		].runCommandAsync(command);
		if (options.showOutput) world.say(result.successCount + "");
		world.sendMessage;
		return result.successCount;
	} catch (error) {
		if (options.showError) DisplayError(error);
		return 0;
	}
}
