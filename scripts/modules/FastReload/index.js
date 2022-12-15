import { XA } from "xapi.js";

new XA.Command({
	name: "r",
}).executes(async (ctx) => {
	await XA.runCommandX("function autoreload");
	ctx.reply("§9> §fSuccesfull!");
});
