import { Dimension, world } from "@minecraft/server";
import { editMethod } from "../patcher.js";
import { util } from "../utils.js";

Object.defineProperty(Dimension.prototype, "type", {
	get() {
		return this.id === "minecraft:overworld"
			? "overworld"
			: this.id === "minecraft:nether"
			? "nether"
			: "end";
	},
});

editMethod(
	Dimension.prototype,
	"runCommand",
	({ original, args: [command, options = {}] }) => {
		try {
			/** @type {any} */
			const result = original(command);
			if (options.showOutput) world.sendMessage(result.successCount + "");
			return result.successCount;
		} catch (error) {
			if (options.showError) util.error(error);
			return 0;
		}
	}
);
