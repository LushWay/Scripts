import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	type: "wb",
	name: "drawsel",
	description: "Переключает отрисовку текущего выделения",
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
	WorldEditBuild.drawselection = !WorldEditBuild.drawselection;
	ctx.reply(`§c► §fОтображение выделения: ${WorldEditBuild.drawselection ? "§aвключено" : "§cвыключено"}`);
});
