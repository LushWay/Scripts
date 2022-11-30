import { IS, XA } from "xapi.js";
import { configuration } from "../../config.js";

const WECommand = new XA.Command({
	/*type: "wb"*/
	/*type: "wb"*/
	name: "worldedit",
	description: "WorldEdit commands",
	aliases: ["we"],
	requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {});

WECommand.literal({
	name: "version",
	description: "Get WorldEdit version",
	aliases: ["ver"],
}).executes((ctx) => {
	ctx.reply(`Current World Edit Version: ${configuration.VERSION}`);
});
