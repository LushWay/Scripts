import { S } from "../../../lib/List/sounds.js";
import { SG } from "../../../lib/List/sounds-types.js";

import { IS, XA } from "xapi.js";
new XA.Command({
	name: "sound",
	aliases: ["so"],
	requires: (p) => IS(p.id, "moderator"),
	type: "test",
})
	.string("sound", true)
	.executes((ctx, sound) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:tool") return ctx.reply(`§cТы держишь не tool!`);
		if (!sound) {
			return ctx.reply(SG.join("\n"));
		}
		let lore = item.getLore();
		lore[0] = "Sound";
		lore[1] = sound ?? S[0];
		lore[2] = `${S.includes(sound) ? S.indexOf(sound) : 0}`;
		item.setLore(lore);
		item.nameTag = "§r§9Sound";
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(
			`§a(s) §rПартикл инструмента изменен на ${sound ?? S[0]} (${S.includes(sound) ? S.indexOf(sound) : "0"})`
		);
	})
	.literal({ name: "n" })
	.int("number")
	.executes((ctx, number) => {
		const item = XA.Entity.getHeldItem(ctx.sender);
		if (!item || item.typeId != "we:tool") return ctx.reply(`§cТы держишь не tool!`);
		let lore = item.getLore();
		let particle = S[number];
		lore[0] = "Sound";
		lore[1] = particle ?? S[0];
		lore[2] = String(number);
		item.nameTag = "§r§9Sound";
		console.warn(JSON.stringify(lore));
		item.setLore(lore);
		XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
		ctx.reply(`§a(s) §rПартикл инструмента изменен на ${particle} (${number})`);
	});
