import { IS, XA } from "xapi.js";
import { SelectionBuild } from "../../modules/builders/SelectionBuilder.js";

new XA.Command({
	name: "pos1",
	aliases: ["p1"],
	description: "Set position 1",
	requires: (p) => IS(p.id, "moderator"),
})
	.location("pos", true)
	.executes((ctx, pos) => {
		SelectionBuild.setPos1(pos.x, pos.y, pos.z);
		ctx.reply(`§5►§r (1) ${pos.x}, ${pos.y}, ${pos.z}`);
		const a = [];
		a.toString();
	});
