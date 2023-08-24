import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

new XCommand({
	type: "we",
	name: "drawsel",
	description: "Переключает отрисовку текущего выделения",
	role: "moderator",
}).executes((ctx) => {
	WorldEditBuild.drawselection = !WorldEditBuild.drawselection;
	ctx.reply(
		`§c► §fОтображение выделения: ${
			WorldEditBuild.drawselection ? "§aвключено" : "§cвыключено"
		}`
	);
});
