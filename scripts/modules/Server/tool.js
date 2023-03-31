import { Player, world } from "@minecraft/server";

import { XA } from "xapi.js";
import { P } from "../../lib/List/particles.js";
import { S } from "../../lib/List/sounds.js";

world.events.beforeItemUse.subscribe((data) => {
	if (data.item.typeId == "we:tool" && data.source instanceof Player) {
		let item = data.item;
		let lore = item.getLore();
		if (lore && lore[0] == "Particle") {
			if (data.source.isSneaking) {
				if (Number(lore[2]) - 1 >= 0) {
					lore[1] = P[Number(lore[2]) - 1] ?? lore[1];
					lore[2] = String(Number(lore[2]) - 1);
					item.setLore(lore);
					XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
				}
			}
			if (!data.source.isSneaking) {
				if (Number(lore[2]) + 1 <= P.length) {
					lore[1] = P[Number(lore[2]) + 1] ?? lore[1];
					lore[2] = String(Number(lore[2]) + 1);
					item.setLore(lore);
					XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
				}
			}
		}
		if (lore && lore[0] == "Loot") {
			if (data.source.isSneaking) {
				if (Number(lore[1] ?? 1) - 1 >= 0) {
					lore[1] = String(Number(lore[1]) - 1);
					item.setLore(lore);
					XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
				}
			}
			if (!data.source.isSneaking) {
				if (Number(lore[1] ?? 0) + 1 <= P.length) {
					lore[1] = String(Number(lore[1]) + 1);
					item.setLore(lore);
					XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
				}
			}
		}
		if (lore && lore[0] == "Sound") {
			if (data.source.isSneaking) {
				if (Number(lore[2]) - 1 >= 0) {
					lore[1] = S[Number(lore[2]) - 1] ?? lore[1];
					lore[2] = String(Number(lore[2]) - 1);
					item.setLore(lore);
					XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
				}
			}
			if (!data.source.isSneaking) {
				lore[1] = S[Number(lore[2]) + 1] ?? lore[1];
				lore[2] = String(Number(lore[2]) + 1);
				item.setLore(lore);
				XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
			}
		}
		if (lore && lore[0] == "run") {
			XA.runCommandX(lore[1]);
		}
		if (lore && lore[0] == "runE") {
			data.source.runCommandAsync(lore[1]);
		}
		if (lore && lore[0] == "viewTP") {
			const block = data.source.getBlockFromViewDirection({});
			if (block && block.location) data.source.teleport(block.location);
		}
	}
});

