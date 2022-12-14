import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	name: "copy",
	description: "Копирует зону",
	requires: (p) => IS(p.id, "moderator"),
	type: "wb",
}).executes((ctx) => {
	const status = WorldEditBuild.copy();
	if (status) ctx.reply(status);
});
