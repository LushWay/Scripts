import { Dimension, world } from "@minecraft/server";
import { OverTakes } from "../prototypes.js";
import { util } from "../util.js";

OverTakes(Dimension.prototype, {
	get type() {
		return this.id === "minecraft:overworld"
			? "overworld"
			: this.id === "minecraft:nether"
			? "nether"
			: "end";
	},
	runCommand(command, options = {}) {
		try {
			const result = super.runCommand(command);
			if (options.showOutput) world.sendMessage(result.successCount + "");
			return result.successCount;
		} catch (error) {
			if (options.showError) util.error(error);
			return 0;
		}
	},
});
