import { BlockLocation, world } from "@minecraft/server";
import { IS, XA } from "xapi.js";

const root = new XA.Command({
	name: "id",
	description: "Выдает айди",
	requires: (p) => IS(p.id, "moderator"),
	type: "test",
}).executes((ctx) => {
	const item = XA.Entity.getHeldItem(ctx.sender);
	ctx.reply(`§b► §f${item?.typeId} ${item?.data} ${item?.nameTag ? item?.nameTag : ""}`);
});

root.literal({ name: "c", description: "очсищ" }).executes((ctx) => {
	const tag = XA.Entity.getTagStartsWith(ctx.sender, "st:");
	ctx.reply(`§b► §c-§f${tag}`);
	XA.Entity.removeTagsStartsWith(ctx.sender, "st:");
});
root.literal({ name: "a", description: "добав" }).executes((ctx) => {
	const blocks = [];
	XA.Entity.getTagStartsWith(ctx.sender, "st:")
		?.split(",")
		?.every((e) => blocks.push(e));
	blocks.push(`${XA.Entity.getHeldItem(ctx.sender)?.typeId}.${XA.Entity.getHeldItem(ctx.sender)?.data}`);
	ctx.reply(`§a► §f${blocks.join(", ")}`);
	XA.Entity.removeTagsStartsWith(ctx.sender, "st:");
	ctx.sender.addTag("st:" + blocks.join(","));
});
root
	.literal({ name: "l", description: "Выдает id блока" })
	.location("location", true)
	.executes((ctx, location) => {
		let l;
		location
			? (l = new BlockLocation(location.x, location.y, location.z))
			: (l = new BlockLocation(
					Math.floor(ctx.sender.location.x),
					Math.floor(ctx.sender.location.y - 1),
					Math.floor(ctx.sender.location.z)
			  ));
		ctx.reply(`§a► §f${world.getDimension("overworld").getBlock(l)?.typeId}`);
	});
root
	.literal({ name: "sl", description: "Задает лор предмета" })
	.string("lore")
	.executes((ctx) => {
		let item = XA.Entity.getHeldItem(ctx.sender);
		let oldtag = item.getLore();
		item.setLore(ctx.args);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
	});
root.literal({ name: "st", description: "Задает лор предмета" }).executes((ctx) => {
	let item = XA.Entity.getHeldItem(ctx.sender);
	let oldtag = item.getLore();
	item.setLore([XA.Entity.getTagStartsWith(ctx.sender, "st:")]);
	XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
	ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
});
root
	.literal({ name: "sn", description: "Задает имя предмета" })
	.string("name")
	.executes((ctx, name) => {
		let item = XA.Entity.getHeldItem(ctx.sender);
		let oldtag = item.nameTag;
		item.nameTag = name;
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.nameTag}`);
	});
root
	.literal({ name: "sc", description: "Задает количество предметов" })
	.int("count")
	.executes((ctx, count) => {
		let item = XA.Entity.getHeldItem(ctx.sender);
		let oldtag = item.amount;
		item.amount = count;
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.amount}`);
	});
root.literal({ name: "rot", description: "Выдает ротатион" }).executes((ctx) => {
	ctx.reply(`§a► §f${ctx.sender.rotation.x} ${ctx.sender.rotation.y}`);
});
