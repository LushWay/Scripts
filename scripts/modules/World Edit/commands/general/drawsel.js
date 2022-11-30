import { IS, XA } from "xapi.js";

import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	/*type: "wb"*/
	name: "drawsel",
	description: "Переключает рисование текущего выделения",
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
	WorldEditBuild.drawsel = !WorldEditBuild.drawsel;
	ctx.reply(`§c► §fОтображение выделения: ${WorldEditBuild.drawsel ? "§aвключено" : "§cвыключено"}`);
});
