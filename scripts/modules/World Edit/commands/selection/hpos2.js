import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	type: "wb",
	name: "hpos2",
	description: "Set position 2 to targeted block",
	role: "moderator",
}).executes((ctx) => {
	const pos = ctx.sender.getBlockFromViewDirection().location;
	if (!pos) return ctx.reply("Неа!");

	WorldEditBuild.pos2 = pos;
	ctx.reply(`§dПозиция§r 2 теперь ${pos.x}, ${pos.y}, ${pos.z}`);
});


