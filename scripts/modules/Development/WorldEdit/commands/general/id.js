import { Vector } from "@minecraft/server";
import { XEntity, util } from "xapi.js";

const root = new XCommand({
	name: "id",
	description: "Выдает айди",
	role: "builder",
	type: "wb",
});

root.executes((ctx) => {
	const item = XEntity.getHeldItem(ctx.sender);
	if (!item) return ctx.reply("§cВ руке нет предмета!");

	ctx.reply(
		`§b► §f${item?.typeId.replace("minecraft:", "")} ${
			item?.nameTag ? `(${item?.nameTag}) ` : ""
		}`
	);
});

root
	.literal({ name: "l", description: "Выдает id блока по локации" })
	.location("location", true)
	.executes((ctx, location) => {
		const l = Vector.floor(location);
		const block = ctx.sender.dimension.getBlock(l);
		if (!block) return ctx.reply("§cНет блока!");
		ctx.reply(`§b► §f${block.typeId.replace("minecraft:", "")}`);
	});

root
	.literal({ name: "p", description: "Выдает все states блока по локации" })
	.location("location", true)
	.executes((ctx, location) => {
		const l = Vector.floor(location);
		const block = ctx.sender.dimension.getBlock(l);
		if (!block) return ctx.reply("§cНет блока!");
		ctx.reply(util.inspect(block.permutation.getAllStates()));
	});

root
	.literal({ name: "r", description: "Выдает наклон головы" })
	.executes((ctx) => {
		ctx.reply(
			`§a► §f${ctx.sender.getRotation().x} ${ctx.sender.getRotation().y}`
		);
	});

root.literal({ name: "c", description: "очсищ" }).executes((ctx) => {
	const tag = XEntity.getTagStartsWith(ctx.sender, "st:");
	ctx.reply(`§b► §c-§f${tag}`);
	XEntity.removeTagsStartsWith(ctx.sender, "st:");
});

root.literal({ name: "a", description: "добав" }).executes((ctx) => {
	const blocks = [];
	XEntity.getTagStartsWith(ctx.sender, "st:")
		?.split(",")
		?.every((e) => blocks.push(e));
	blocks.push(`${XEntity.getHeldItem(ctx.sender)?.typeId}`);
	ctx.reply(`§a► §f${blocks.join(", ")}`);
	XEntity.removeTagsStartsWith(ctx.sender, "st:");
	ctx.sender.addTag("st:" + blocks.join(","));
});
root
	.literal({ name: "st", description: "Задает лор предмета" })
	.executes((ctx) => {
		let item = XEntity.getHeldItem(ctx.sender);
		let oldtag = item.getLore();
		item.setLore([XEntity.getTagStartsWith(ctx.sender, "st:")]);
		ctx.sender
			.getComponent("inventory")
			.container.setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
	});
