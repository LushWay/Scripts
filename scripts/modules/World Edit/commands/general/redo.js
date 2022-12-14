import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	type: "wb",
	name: "redo",
	description: "Возвращает последнее действие (из памяти)",
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
	const command = WorldEditBuild.redo();
	if (command) ctx.reply(command);
});
