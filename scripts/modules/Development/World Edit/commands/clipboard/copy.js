import { XA } from "xapi.js";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XA.Command({
	name: "copy",
	description: "Копирует зону",
	role: "moderator",
	type: "wb",
}).executes((ctx) => {
	const status = WorldEditBuild.copy();
	if (status) ctx.reply(status);
});
