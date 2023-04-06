import { XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
import { Vector } from "@minecraft/server";

new XA.Command({
	type: "wb",
	name: "size",
	description: "Получет информация о выделенной зоне",
	role: "moderator",
}).executes((ctx) => {
	if (!WorldEditBuild.selectionCuboid) return ctx.reply("§cЗона не выделена!");
	ctx.reply(
		`В выделенной зоне ${Vector.size(
			WorldEditBuild.pos1,
			WorldEditBuild.pos2
		)} блоков`
	);
});


