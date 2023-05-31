import { world } from "@minecraft/server";
import { util } from "xapi.js";

/**
 * @typedef {{
 *   showOutput?: boolean;
 *   showError?: boolean;
 *   dimension?: "overworld" | "nether" | "end"
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
		const result = await world[
			options.dimension ?? "overworld"
		].runCommandAsync(command);
		if (options.showOutput) world.say(result.successCount + "");
		world.sendMessage;
		return result.successCount;
	} catch (error) {
		if (options.showError) util.error(error);
		return 0;
	}
}
