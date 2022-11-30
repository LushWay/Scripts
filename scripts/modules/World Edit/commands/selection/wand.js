import { IS, XA } from "xapi.js";

//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	/*type: "wb"*/
	name: "wand",
	description: "Выдет топор",
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
	ctx.sender.runCommandAsync(`give @s we:wand`);
});
