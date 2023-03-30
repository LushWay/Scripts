import { P } from "../../../lib/List/particles.js";

import { XA } from "xapi.js";
new XA.Command({
	name: "particle",
	aliases: ["p"],
	role: "moderator",
	type: "test",
})
	.string("particle", true)
	.executes((ctx, particle) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:tool")
			return ctx.reply(`§cТы держишь не tool!`);
		let lore = item.getLore();
		lore[0] = "Particle";
		lore[1] = particle ?? P[0];
		lore[2] = "0";
		item.setLore(lore);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(
			`§a► §fПартикл инструмента изменен на ${particle ?? P[0]} (${
				P.includes(particle) ? P.indexOf(particle) : "0"
			})`
		);
	})
	.literal({ name: "n" })
	.int("number")
	.executes((ctx, _, number) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:tool")
			return ctx.reply(`§cТы держишь не tool!`);
		let lore = item.getLore();
		let particle = P[number];
		lore[0] = "Particle";
		lore[1] = particle ?? P[0];
		lore[2] = String(number);
		console.warn(JSON.stringify(lore));
		item.setLore(lore);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a► §fПартикл инструмента изменен на ${particle} (${number})`);
	});

