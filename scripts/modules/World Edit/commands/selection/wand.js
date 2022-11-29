import { XA } from "xapi.js";

//import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";

new XA.Command({
	/*type: "wb"*/
	name: "wand",
	description: "Выдет топор",
	requires: (p) => p.hasTag("commands"),
}).executes((ctx) => {
	ctx.sender.runCommandAsync(`give @s we:wand`);
});
