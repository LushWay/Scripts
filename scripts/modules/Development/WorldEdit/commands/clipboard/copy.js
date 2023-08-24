import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XCommand({
	name: "copy",
	description: "Копирует зону",
	role: "moderator",
	type: "we",
}).executes((ctx) => {
	const status = WorldEditBuild.copy();
	if (status) ctx.reply(status);
});
