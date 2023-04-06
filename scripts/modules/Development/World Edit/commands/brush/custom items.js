import { ItemStack, ItemTypes } from "@minecraft/server";
import { XA } from "xapi.js";

const shovelCMD = new XA.Command({
	name: "shovel",
	description: "Выдает лопату",
	aliases: ["sh"],
	role: "moderator",
	type: "wb",
})

	.string("blocks", true)
	.int("высота", true)
	.int("радиус", true)
	.string("replaceBlocks", true)
	//.boolean("zone")
	//.int("offset")
	.executes((ctx, blocks, высота, радиус, replaceBlocks /*zone, offset*/) => {
		if (!blocks) {
			ctx.reply("brush.help.text");
		}
		if (!радиус) return ctx.reply("§c" + радиус);
		const brush = new ItemStack(ItemTypes.get(`we:s`));
		if (радиус > 6) return ctx.reply("§c► Зачем тебе такой БОЛЬШОЙ?)");
		if (высота > 10) return ctx.reply("§c► Зачем тебе такой БОЛЬШОЙ?)");
		let bblocks;
		blocks == "st"
			? (bblocks = XA.Entity.getTagStartsWith(ctx.sender, "st:"))
			: (bblocks = blocks);
		brush.setLore([
			"§9Adv",
			`Blocks: ${bblocks}`,
			`RBlocks: ${replaceBlocks ?? "any"}`,
			`H: ${высота} R: ${радиус ?? 1}`,
			`Z: - O: 1`,
		]);
		XA.Entity.getI(ctx.sender).addItem(brush);
		ctx.reply(
			`§a► §rПолучена лопата ${blocks} блоками, высотой ${высота}, радиусом ${радиус} и заполняемыми блоками ${replaceBlocks}`
		);
	});

shovelCMD
	.literal({
		name: "height",
		description: "Устанавливает высоту",
		aliases: ["h"],
	})
	.int("height")
	.executes((ctx, height) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:shovel")
			return ctx.reply(`§cТы держишь не лопату!`);
		let lore = item.getLore();
		let c = lore[3].split(" ");
		c[1] = height;
		lore[3] = c.join(" ");
		item.setLore(lore);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a(s) §rВысота лопаты изменена на ${height}`);
	});

shovelCMD
	.literal({
		name: "blocks",
		description: "Устанавливает блоки лопаты",
	})
	.string("blocks")
	.executes((ctx, blocks) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:s")
			return ctx.reply(`§cТы держишь не лопату!`);
		let lore = item.getLore();
		let bblocks;
		blocks == "st"
			? (bblocks = XA.Entity.getTagStartsWith(ctx.sender, "st:"))
			: (bblocks = blocks);
		lore[1] = `Blocks: ${bblocks}`;
		item.setLore(lore);
		XA.Entity.getI(ctx.sender);
	});

shovelCMD
	.literal({
		name: "rblocks",
		description: "Устанавливает заменяемые блоки лопаты",
	})
	.string("blocks")
	.executes((ctx, blocks) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:s")
			return ctx.reply(`§cТы держишь не лопату!`);
		let lore = item.getLore();
		lore[2] = `RBlocks: ${blocks}`;
		item.setLore(lore);
		XA.Entity.getI(ctx.sender);
	});

shovelCMD
	.literal({
		name: "radius",
		description: "Устанавливает максимальное расстояние для кисти",
	})
	.int("radius")
	.executes((ctx, radius) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:s")
			return ctx.reply(`§cТы держишь не лопату!`);
		let lore = item.getLore();
		let c = lore[3].split(" ");
		c[3] = radius;
		lore[3] = c.join(" ");
		item.setLore(lore);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a(s) §rРадиус лопаты изменен на ${radius}`);
	});


