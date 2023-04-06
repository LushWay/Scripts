new XA.Command({
	name: "ws",
	description: "Выдает/убирает меню из инвентаря",
	role: "admin",
}).executes(async (ctx) => {
	if (await XA.Entity.hasItem(ctx.sender, 0, "sa:a")) {
		XA.runCommandX(`clear "${ctx.sender.name}" sa:a`);
		ctx.reply("§a► §fМеню убрано.");
	} else {
		XA.runCommandX(`give "${ctx.sender.name}" sa:a`);
		ctx.reply("§a► §fМеню выдано.");
	}
});
