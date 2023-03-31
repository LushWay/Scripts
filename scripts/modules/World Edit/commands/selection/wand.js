import { XA } from "xapi.js";

new XA.Command({
	type: "wb",
	name: "wand",
	description: "Выдет топор",
	role: "moderator",
}).executes((ctx) => {
	ctx.sender.runCommandAsync(`give @s we:wand`);
});


