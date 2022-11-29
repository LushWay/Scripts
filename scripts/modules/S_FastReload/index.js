import { XA } from "xapi.js";

new XA.Command({
	name: "r",
}).executes((ctx) => {
	XA.runCommandX("function autoreload");
	ctx.reply("§9> §fSuccesfull!");
});
