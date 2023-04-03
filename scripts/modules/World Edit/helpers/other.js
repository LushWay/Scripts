const cos = new XA.Command({
	name: "i",
	description: "Создает динамический список предметов",
	role: "moderator",
	type: "test",
});
cos
	.literal({
		name: "add",
		description: "Добавляет предмет в руке в список",
	})
	.string("id")
	.executes((ctx, id) => {
		ctx.reply(
			"Зарегано под айди: " +
				XA.tables.i.add(XA.Entity.getHeldItem(ctx.sender), id)
		);
	});
cos
	.literal({ name: "get" })
	.string("lore")
	.executes((ctx, lore) => {
		XA.Entity.getI(ctx.sender).setItem(
			ctx.sender.selectedSlot,
			XA.tables.i.get(lore)
		);
	});
cos
	.literal({ name: "del" })
	.string("lore")
	.executes((ctx, lore) => {
		ctx.reply(XA.tables.i.delete(lore));
	});
cos.literal({ name: "list" }).executes((ctx) => {
	const ii = XA.tables.i.items();
	if (ii.length > 1) {
		ctx.reply(
			ii
				.map((e) => `${e.typeId} (§r ${e.getLore().join(", ")} §r)`)
				.sort()
				.join("\n")
		);
	} else {
		ctx.reply("§cПусто.");
	}
});
