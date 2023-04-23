import { Dimension } from "@minecraft/server";

Object.defineProperty(Dimension.prototype, "type", {
	get() {
		return this.id === "minecraft:overworld"
			? "overworld"
			: this.id === "minecraft:nether"
			? "nether"
			: "end";
	},
});
Dimension.prototype;
