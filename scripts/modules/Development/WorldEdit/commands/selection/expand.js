import { SelectionBuild } from "../../builders/SelectionBuilder.js";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

const expand = new XCommand({
	type: "wb",
	name: "expand",
	description: "Expand the selection area",
	role: "moderator",
});

expand.int("size").executes((ctx, size) => {
	if (!WorldEditBuild.selectionCuboid) return ctx.reply("§cЗона не выделена!");
	SelectionBuild.expand(size);
	ctx.reply(
		`§b► §3Выделенная зона поднята на §f${size} §3блоков, теперь она с \n§f${WorldEditBuild.pos1.x} ${WorldEditBuild.pos1.y} ${WorldEditBuild.pos1.z} \n§3по \n§f${WorldEditBuild.pos2.x} ${WorldEditBuild.pos2.y} ${WorldEditBuild.pos2.z}`
	);
});

expand
	.literal({
		name: "vert",
		description: "Vertically expand the selection to world limits.",
	})
	.int("size")
	.executes((ctx, size) => {
		if (!WorldEditBuild.selectionCuboid)
			return ctx.reply("§cЗона не выделена!");
		SelectionBuild.expandVert(size);
		ctx.reply(
			`§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с \n§f${WorldEditBuild.pos1.x} ${WorldEditBuild.pos1.y} ${WorldEditBuild.pos1.z} \n§3по \n§f${WorldEditBuild.pos2.x} ${WorldEditBuild.pos2.y} ${WorldEditBuild.pos2.z}`
		);
	});
