import {
	MolangVariableMap,
	Player,
	Vector,
	system,
	world,
} from "@minecraft/server";

import { ListParticles } from "lib/List/particles.js";
import { ListSounds } from "lib/List/sounds.js";
import { XEntity } from "xapi.js";

const variables = new MolangVariableMap();

system.runPlayerInterval(
	(player) => {
		const item = XEntity.getHeldItem(player);
		if (!item || item.typeId !== "we:tool") return;

		const lore = item.getLore();

		if (lore[0] === "Particle") {
			const { block } = player.getBlockFromViewDirection({
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

const lists = {
	Particle: ListParticles,
	Sound: ListSounds,
};

world.afterEvents.itemUse.subscribe((data) => {
	const item = data.itemStack;
	if (item.typeId === "we:tool" && data.source instanceof Player) {
		let lore = item.getLore();
		if (!lore || !lore[0]) return;
		const act = lore[0];

		if (lore && act in lists) {
			// @ts-expect-error
			const list = lists[act];
			const num = Number(lore[2]) + (data.source.isSneaking ? 1 : -1);
			lore[1] = list[num] ?? lore[1];
			lore[2] = num.toString();
			item.setLore(lore);
			data.source
				.getComponent("inventory")
				.container.setItem(data.source.selectedSlot, item);
		}
		if (act === "runCommand") {
			world.overworld.runCommand(lore[1]);
		}
		if (act === "teleportToView") {
			const block = data.source.getBlockFromViewDirection().block;
			if (block && block.location) data.source.teleport(block.location);
		}
	}
});
