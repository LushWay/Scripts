import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XCommand({
	type: "wb",
	name: "hpos1",
	description: "Set position 1 to targeted block",
	role: "moderator",
}).executes((ctx) => {
	const pos = ctx.sender.getBlockFromViewDirection().location;
	if (!pos) return ctx.reply("Неа!");

	WorldEditBuild.pos1 = pos;
	ctx.reply(`§5Позиция§r 1 теперь ${pos.x}, ${pos.y}, ${pos.z}`);
});
