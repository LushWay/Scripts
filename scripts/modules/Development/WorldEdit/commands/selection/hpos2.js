import { Vector } from "@minecraft/server";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XCommand({
	type: "we",
	name: "hpos2",
	description: "Set position 2 to targeted block",
	role: "moderator",
}).executes((ctx) => {
	const pos = ctx.sender.getBlockFromViewDirection();
	if (!pos) return ctx.reply("Неа!");

	WorldEditBuild.pos2 = pos.block.location;
	ctx.reply(`§dПозиция§r 2 теперь ${Vector.string(WorldEditBuild.pos1)}`);
});
