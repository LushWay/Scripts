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
export function XRunCommand(command: string, options?: ICommandOptions): Promise<number>;
export type ICommandOptions = {
    showOutput?: boolean;
    showError?: boolean;
    dimension?: "overworld" | "nether" | "the_end";
};
