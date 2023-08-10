import { XEntity } from "xapi.js";

const root = new XCommand({
	name: "item",
	description: "Управляет предметом в руке",
	role: "moderator",
	type: "test",
});

root
	.literal({ name: "lore", aliases: ["l"], description: "Задает лор предмета" })
	.string("lore")
	.executes((ctx) => {
		const item = XEntity.getHeldItem(ctx.sender);
		if (!item) return ctx.reply("§cВ руке нет предмета!");
		let oldtag = item.getLore();
		item.setLore(ctx.args);
		ctx.sender
			.getComponent("inventory")
			.container.setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
	});

root
	.literal({ name: "name", aliases: ["n"], description: "Задает имя предмета" })
	.string("name")
	.executes((ctx, name) => {
		const item = XEntity.getHeldItem(ctx.sender);
		if (!item) return ctx.reply("§cВ руке нет предмета!");
		let oldtag = item.nameTag;
		item.nameTag = name;
		ctx.sender
			.getComponent("inventory")
			.container.setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.nameTag}`);
	});
root
	.literal({
		name: "count",
		aliases: ["c"],
		description: "Задает количество предметов",
	})
	.int("count")
	.executes((ctx, count) => {
		const item = XEntity.getHeldItem(ctx.sender);
		if (!item) return ctx.reply("§cВ руке нет предмета!");
		let oldtag = item.amount;
		item.amount = count;
		ctx.sender
			.getComponent("inventory")
			.container.setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.amount}`);
	});
