import { BeforeChatEvent, world } from "@minecraft/server";
import { CommandContext } from "./Callback.js";
import { XCommand } from "./index.js";

export class CmdLet {
	/**
	 * @type {CmdLet[]}
	 */
	static ALL = [];
	/**
	 *
	 * @param {string[]} args
	 * @param {BeforeChatEvent} data
	 * @param {XCommand} cmd
	 * @returns
	 */
	static workWithCmdlets(data, args, cmd) {
		const cmdlets = args
			.filter((e) => e.startsWith("--"))
			.map((e) => {
				// Remove -- part
				e = e.substring(2);

				// Bool or --help like cmdlet
				if (!e.includes("=")) return [e, ""];

				const [cmdlet, ...arg] = e.split("=");
				return [cmdlet, arg.join("=")];
			});

		const results = [];
		for (const cmdlet of CmdLet.ALL) {
			const input = cmdlets.find((e) => e[0] === cmdlet.data.name);
			if (input) {
				results.push(
					cmdlet.data.callback(new CommandContext(data, args, cmd), input[0])
				);
			}
		}

		if (results.includes("stop")) return "stop";
	}
	/**
	 * Creates a new cmdlet to use it in command like 'name --help'
	 * @param {{name: string, callback(ctx: CommandContext, param: string): 'stop' | void}} info
	 */
	constructor({ name, callback }) {
		this.data = { name, callback };

		CmdLet.ALL.push(this);
	}
}
