import { Vector } from "@minecraft/server";
import { XA } from "xapi.js";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XA.Command({
	name: "pos2",
	aliases: ["p2"],
	description: "Устанавливает позицию 2 (использовать)",
	role: "moderator",
})
	.location("pos", true)
	.executes((ctx, pos) => {
		pos = Vector.floor(pos);

		WorldEditBuild.pos2 = pos;
		ctx.reply(`§d►§r (2) ${pos.x}, ${pos.y}, ${pos.z}`);
	});