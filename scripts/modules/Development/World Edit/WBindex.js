import { Player, system, Vector, world } from "@minecraft/server";

import "./commands/index.js";

import { Options, XEntity } from "xapi.js";
import { FillFloor } from "./builders/FillBuilder.js";
import { Shape } from "./builders/ShapeBuilder.js";
import "./builders/ToolBuilder.js";
import { WorldEditBuild } from "./builders/WorldEditBuilder.js";
import { CONFIG_WB } from "./config.js";
import { SHAPES } from "./utils/shapes.js";
import { setblock } from "./utils/utils.js";

const GetPlayerSettings = Options.player("Строитель мира", "wb", {
	noBrushParticles: {
		desc: "Отключает партиклы у кисти",
		value: false,
		name: "Партиклы кисти",
	},
	enableMobile: {
		desc: "Включает мобильное управление",
		value: false,
		name: "Мобильное управление",
	},
});

/* Replaces the block with a random block from the lore of the item. */
world.afterEvents.blockPlace.subscribe((data) => {
	if (data.block.typeId !== "minecraft:warped_nylium") return;
	let blocks = XEntity.getHeldItem(data.player).getLore();
	if (blocks.length < 1) return;
	blocks = blocks[0].split(",");
	const location = data.block.location;
	const block = blocks[~~(Math.random() * blocks.length)];
	setblock(block, location);
});

system.runPlayerInterval(
	(p) => {
		const i = XEntity.getHeldItem(p);
		const settings = GetPlayerSettings(p);
		const lore = i?.getLore() ?? [];
		if (
			i?.typeId === "we:s" &&
			settings.enableMobile &&
			p.hasTag("using_item")
		) {
			if (lore[4] && lore[0] === "§aActive") {
				const block = lore[1].split(" ")[1];
				const data = lore[1].split(" ")[2];
				const H = lore[3].split(" ")[1];
				const R = lore[3].split(" ")[3];
				const Z = lore[4].split(" ")[1].replace("+", "");
				const O = lore[4].split(" ")[3];
				if (lore[0] == "§aActive")
					p.runCommandAsync(
						`fill ~-${R} ~${Z}${H} ~-${R} ~${R} ~${Z}${O} ~${R} ${block} ${data}`
					);
			}
		}
		if (i?.typeId === "we:brush" && !settings.noBrushParticles) {
			/** @type {import("@minecraft/server").BlockRaycastOptions} */
			const q = {};
			const range = lore[3]?.replace("Range: ", "");
			if (range) {
				q.maxDistance = parseInt(range);
				const block = p.getBlockFromViewDirection(q);
				if (block) {
					const ent1 = block.dimension.getEntitiesAtBlockLocation(
						block.location
					);
					if (!ent1) {
						world.overworld.runCommand(
							`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`
						);
						world.overworld.runCommand(
							`summon f:t ${block.location.x} ${
								block.location.y - CONFIG_WB.H
							} ${block.location.z} spawn "${CONFIG_WB.BRUSH_LOCATOR}"`
						);
						world.overworld.runCommand(
							`tag @e[x=${block.location.x},y=${
								block.location.y - CONFIG_WB.H
							},z=${block.location.z},r=1,type=f:t,name="${
								CONFIG_WB.BRUSH_LOCATOR
							}"] add "${p.name}"`
						);
					}
					for (let ent of ent1) {
						if (ent.id == "f:t" && ent.nameTag == CONFIG_WB.BRUSH_LOCATOR)
							break;
						world.overworld.runCommand(
							`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`
						);
						world.overworld.runCommand(
							`summon f:t ${block.location.x} ${
								block.location.y - CONFIG_WB.H
							} ${block.location.z} spawn "${CONFIG_WB.BRUSH_LOCATOR}"`
						);
						world.overworld.runCommand(
							`tag @e[x=${block.location.x},y=${
								block.location.y - CONFIG_WB.H
							},z=${block.location.z},r=1,type=f:t,name="${
								CONFIG_WB.BRUSH_LOCATOR
							}"] add "${p.name}"`
						);
						break;
					}
				}
			}
		} else {
			world.overworld.runCommand(
				`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`
			);
		}
		if (i?.typeId === "we:s" && lore[4] && lore[0] === "§9Adv") {
			const B = lore[1].split(" ")[1].split(",");
			const RB = lore[2]?.split(" ")[1];
			const R = Number(lore[3].split(" ")[3]);
			if (R < 2) return;
			const Z = lore[4].split(" ")[1].replace("+", "");
			const H = Number(`${Z}${lore[3].split(" ")[1]}`);
			const O = Number(`${Z}${lore[4].split(" ")[3]}`);
			const newloc = Vector.floor(p.location);
			FillFloor(
				Vector.add(newloc, new Vector(-R, H, -R)),
				Vector.add(newloc, new Vector(R, O, R)),
				B,
				RB ?? "any"
			);
		}
	},
	"WB Main",
	10
);

system.runInterval(
	() => {
		WorldEditBuild.drawSelection();
	},
	"WB Selection",
	20
);

world.afterEvents.itemUseOn.subscribe((data) => {
	if (data.itemStack.typeId !== "we:wand" || !(data.source instanceof Player))
		return;

	const blockLocation = data.block;
	const pos = WorldEditBuild.pos2 ?? { x: 0, y: 0, z: 0 };
	if (
		pos.x === blockLocation.x &&
		pos.y === blockLocation.y &&
		pos.z === blockLocation.z
	)
		return;
	WorldEditBuild.pos2 = blockLocation;
	data.source.tell(
		`§d►2◄§f (use) ${blockLocation.x}, ${blockLocation.y}, ${blockLocation.z}` //§r
	);
});

world.afterEvents.itemUse.subscribe((data) => {
	if (!(data.source instanceof Player)) return;
	if (data.itemStack.typeId === "we:s") {
		let lore = data.itemStack.getLore();
		let q = true;
		switch (lore[0]) {
			case "§Active":
				if (!q) break;
				lore[0] = "§cDisactive";
				q = false;
				break;
			case "§cDisactive":
				if (!q) break;
				lore[0] = "§aActive";
				q = false;
				break;
			case "§9Adv":
				if (!q) break;
				lore[0] = "§cAdv";
				q = false;
				break;
			case "§cAdv":
				if (!q) break;
				lore[0] = "§9Adv";
				q = false;
				break;
		}
		const item = data.itemStack;
		item.setLore(lore);
		data.source
			.getComponent("inventory")
			.container.setItem(data.source.selectedSlot, item);
	}

	if (data.itemStack.typeId !== "we:brush") return;
	const sett = GetPlayerSettings(data.source);
	if (sett.enableMobile) return;
	const lore = data.itemStack.getLore();
	const shape = lore[0]?.replace("Shape: ", "");
	const blocks = lore[1]?.replace("Blocks: ", "").split(",");
	const size = lore[2]?.replace("Size: ", "");
	const range = lore[3]?.replace("Range: ", "");
	if (!shape || !blocks || !size || !range) return;

	const block = data.source.getBlockFromViewDirection({
		maxDistance: parseInt(range),
	});

	if (block) new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
});

world.afterEvents.itemUse.subscribe((data) => {
	if (data.itemStack.typeId.startsWith("l:")) {
		data.source.runCommandAsync(`tp ^^^5`);
	}
});

world.afterEvents.blockBreak.subscribe((data) => {
	if (XEntity.getHeldItem(data.player)?.typeId !== "we:wand") return;
	const pos = WorldEditBuild.pos1 ?? { x: 0, y: 0, z: 0 };
	if (
		pos.x === data.block.location.x &&
		pos.y === data.block.location.y &&
		pos.z === data.block.location.z
	)
		return;
	WorldEditBuild.pos1 = data.block.location;
	data.player.tell(
		`§5►1◄§r (break) ${data.block.location.x}, ${data.block.location.y}, ${data.block.location.z}`
	);
	data.dimension
		.getBlock(data.block.location)
		.setPermutation(data.brokenBlockPermutation);
});
