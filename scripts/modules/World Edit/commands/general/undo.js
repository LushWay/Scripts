import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	type: "wb",
	name: "undo",
	description: "Отменяет последнее действие (из памяти)",
	requires: (p) => IS(p.id, "moderator"),
})
	.int("undoCount")
	.executes((ctx, r) => {
		const status = WorldEditBuild.undo(r);
		ctx.reply(status);
	});
