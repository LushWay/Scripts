import { Vector } from "@minecraft/server";
import { SelectionBuild } from "../../builders/SelectionBuilder.js";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

const expand = new XCommand({
	type: "we",
	name: "expand",
	description: "Расширить выделенную зону во все стороны или вертикально",
	role: "moderator",
});

expand.int("size").executes((ctx, size) => {
	if (!WorldEditBuild.selectionCuboid) return ctx.reply("§cЗона не выделена!");
	SelectionBuild.expand(size);
	ctx.reply(
		`§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vector.string(
			WorldEditBuild.pos1
		)}\n§3по \n§f${Vector.string(WorldEditBuild.pos2)}`
	);
});

expand
	.literal({
		name: "vert",
		description: "Поднять выделенную зону",
	})
	.int("size")
	.executes((ctx, size) => {
		if (!WorldEditBuild.selectionCuboid)
			return ctx.reply("§cЗона не выделена!");
		SelectionBuild.expandVert(size);
		ctx.reply(
			`§b► §3Выделенная зона поднята на §f${size} §3блоков вверх, теперь она с\n§f${Vector.string(
				WorldEditBuild.pos1
			)}\n§3по \n§f${Vector.string(WorldEditBuild.pos2)}`
		);
	});
