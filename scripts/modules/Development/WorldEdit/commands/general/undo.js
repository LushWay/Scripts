import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XCommand({
	type: "we",
	name: "undo",
	description: "Отменяет последнее действие (из памяти)",
	role: "moderator",
})
	.int("undoCount", true)
	.executes((ctx, r) => {
		const status = WorldEditBuild.undo(!isNaN(r) ? r : 1);
		ctx.reply(status);
	});
