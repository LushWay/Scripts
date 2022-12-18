//import { Items, ItemStack } from "@minecraft/server";
import { IS, XA } from "xapi.js";

new XA.Command({
	type: "wb",
	name: "tool",
	description: "Gives a tool item in your inventory",
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
	ctx.sender.runCommandAsync("give @s we:tool");
});
