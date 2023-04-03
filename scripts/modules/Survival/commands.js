import { SERVER } from "../Server/var.js";

new XA.Command({
	name: "resetpos",
	description: "Удаляет информацию о позиции на анархии",
	type: "public",
	role: "member",
}).executes((ctx) => {
	ctx.reply(XA.tables.player.delete("POS:" + ctx.sender.id) + "");
});

new XA.Command({
	name: "radius",
	description: "Выдает радиус границы анархии сейчас",
	type: "public",
	role: "member",
}).executes((ctx) => {
	ctx.reply(`☺ ${SERVER.radius}`);
});
