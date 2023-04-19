import { Player, Vector, system, world } from "@minecraft/server";

import { P } from "lib/List/particles.js";
import { S } from "lib/List/sounds.js";
import { XA } from "xapi.js";
import { DefaultParticlePropertiesBuilder } from "../../../../lib/Class/Particles.js";

const map = new DefaultParticlePropertiesBuilder();
// map.setAmount(1).setColor({red: 1, blue: 2, green: 3, alpha: 0}).setDirection(Vector.up)
const variables = map.getMolangVariableMap();

system.runPlayerInterval(
	(player) => {
		const item = XA.Entity.getHeldItem(player);
		if (!item || item.typeId !== "we:tool") return;

		const lore = item.getLore();

		if (lore[0] === "Particle") {
			const block = player.getBlockFromViewDirection({
				includeLiquidBlocks: false,
				includePassableBlocks: false,
				maxDistance: 50,
			});

			if (!block) return;

			block.dimension.spawnParticle(
				lore[1],
				Vector.add(block.location, { x: 0.5, z: 0.5, y: 1.5 }),
				variables
			);
		}

		if (lore[0] === "Sound") {
			player.playSound(lore[1]);
		}
	},
	"wb tool",
	20
);

world.events.itemUse.subscribe((data) => {
	const item = data.itemStack;
	if (item.typeId == "we:tool" && data.source instanceof Player) {
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
