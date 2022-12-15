import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	name: "pos2",
	aliases: ["p2"],
	description: "Устанавливает позицию 2 (использовать)",
	requires: (p) => IS(p.id, "moderator"),
})
	.location("pos", true)
	.executes((ctx, pos) => {
		WorldEditBuild.pos2 = pos;
		ctx.reply(`§d►§r (2) ${pos.x}, ${pos.y}, ${pos.z}`);
	});
