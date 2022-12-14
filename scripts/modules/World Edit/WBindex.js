import { BlockLocation, MinecraftBlockTypes, Player, world } from "@minecraft/server";
import { setPlayerInterval, setTickInterval, ThrowError, XA } from "xapi.js";

import "./commands/index.js";
import { WB_CONFIG } from "./config.js";
import { Fill } from "./modules/builders/FillBuilder.js";
import { SelectionBuild } from "./modules/builders/SelectionBuilder.js";
import { Shape } from "./modules/builders/ShapeBuilder.js";
import { WorldEditBuild } from "./modules/builders/WorldEditBuilder.js";
import { SHAPES } from "./modules/utils/shapes.js";

const GetPlayerSettings = XA.PlayerOptions("wb", {
	noBrushParticles: { desc: "Отключает партиклы у кисти", value: false },
	enableMobile: { desc: "Включает мобильное управление", value: false },
});

/* It's a code that replaces the block with a random block from the lore of the item. */
world.events.blockPlace.subscribe((data) => {
	if (data.block.typeId !== "minecraft:warped_nylium") return;
	const blocks = XA.Entity.getHeldItem(data.player).getLore();
	if (blocks.length < 1) return;
	const location = data.block.location;
	const block = blocks[~~(Math.random() * blocks.length)];
	if (/^(.+)\.(\d+)/g.test(block)) {
		// Block is written like "stone.3", so we need to get data and id
		const [_, id, data] = /^(.+)\.(\d+)/g.exec(block);
		XA.runCommandX(`setblock ${location.x} ${location.y} ${location.z} ${id} ${data}`);
	} else {
		const blockType = MinecraftBlockTypes.get(`minecraft:${block}`);
		if (!blockType) return ThrowError(new TypeError(`BlockType ${block} does not exist!`));
		data.dimension.getBlock(location).setType(blockType);
	}
});

setPlayerInterval(
	(p) => {
		const i = XA.Entity.getHeldItem(p);
		if (i?.typeId !== "we:s") return;

		const lore = i.getLore();
		if (!lore[4] && lore[0] !== "§9Adv") return;

		const B = lore[1].split(" ")[1].split(",");
		const RB = lore[2]?.split(" ")[1];
		const R = Number(lore[3].split(" ")[3]);
		if (R < 2) return;
		const Z = lore[4].split(" ")[1].replace("+", "");
		const H = Number(`${Z}${lore[3].split(" ")[1]}`);
		const O = Number(`${Z}${lore[4].split(" ")[3]}`);
		new Fill(
			new BlockLocation(Math.floor(p.location.x - R), Math.floor(p.location.y + H), Math.floor(p.location.z - R)),
			new BlockLocation(Math.floor(p.location.x + R), Math.floor(p.location.y + O), Math.floor(p.location.z + R)),
			B,
			RB ?? "any"
		);
	},
	10,
	"WB:AdvancedFiller"
);

setPlayerInterval((p) => {
	const i = XA.Entity.getHeldItem(p);
	const settings = GetPlayerSettings(p);
	if (i?.typeId === "we:s" && settings.enableMobile && p.hasTag("using_item")) {
		const i = XA.Entity.getHeldItem(p);
		const lore = i.getLore();
		if (lore[4] && lore[0] == "§aActive") {
			const block = lore[1].split(" ")[1];
			const data = lore[1].split(" ")[2];
			const H = lore[3].split(" ")[1];
			const R = lore[3].split(" ")[3];
			const Z = lore[4].split(" ")[1].replace("+", "");
			const O = lore[4].split(" ")[3];
			if (lore[0] == "§aActive")
				p.runCommandAsync(`fill ~-${R} ~${Z}${H} ~-${R} ~${R} ~${Z}${O} ~${R} ${block} ${data}`);
		}
	}
	if (XA.Entity.getHeldItem(p)?.typeId == "we:brush" && !settings.noBrushParticles) {
		const lore = XA.Entity.getHeldItem(p).getLore();
		/** @type {import("@minecraft/server").BlockRaycastOptions} */
		const q = {};
		const range = lore[3]?.replace("Range: ", "");
		if (range) {
			q.maxDistance = parseInt(range);
			const block = p.getBlockFromViewVector(q);
			if (block) {
				const ent1 = XA.Entity.getEntityAtPos(block.location.x, block.location.y, block.location.z);
				if (!ent1) {
					XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
					XA.runCommandX(
						`summon f:t ${block.location.x} ${block.location.y - WB_CONFIG.H} ${block.location.z} spawn "${
							WB_CONFIG.BRUSH_LOCATOR
						}"`
					);
					XA.runCommandX(
						`tag @e[x=${block.location.x},y=${block.location.y - WB_CONFIG.H},z=${
							block.location.z
						},r=1,type=f:t,name="${WB_CONFIG.BRUSH_LOCATOR}"] add "${p.name}"`
					);
				}
				for (let ent of ent1) {
					if (ent.id == "f:t" && ent.nameTag == WB_CONFIG.BRUSH_LOCATOR) break;
					XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
					XA.runCommandX(
						`summon f:t ${block.location.x} ${block.location.y - WB_CONFIG.H} ${block.location.z} spawn "${
							WB_CONFIG.BRUSH_LOCATOR
						}"`
					);
					XA.runCommandX(
						`tag @e[x=${block.location.x},y=${block.location.y - WB_CONFIG.H},z=${
							block.location.z
						},r=1,type=f:t,name="${WB_CONFIG.BRUSH_LOCATOR}"] add "${p.name}"`
					);
					break;
				}
			}
		}
	} else {
		XA.runCommandX(`event entity @e[type=f:t,name="${WB_CONFIG.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
	}
}, 0);

setTickInterval(() => {
	for (const p of world.getPlayers()) {
		//console.warn(p.name + " id fail");
		if (!p.hasTag("mobile") || !p.hasTag("attacking") || XA.Entity.getHeldItem(p)?.typeId != "we:brush") continue; ////console.warn(p.name + " id fail");

		const lore = XA.Entity.getHeldItem(p).getLore();
		const shape = lore[0]?.replace("Shape: ", "");
		const blocks = lore[1]?.replace("Blocks: ", "").split(",");
		const size = lore[2]?.replace("Size: ", "");
		const range = lore[3]?.replace("Range: ", "");
		if (!shape || !blocks || !size || !range) continue;
		/** @type {import("@minecraft/server").BlockRaycastOptions} */
		const q = {};
		q.maxDistance = parseInt(range);
		const block = p.getBlockFromViewVector(q);

		if (block) new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
	}
}, 5);

//////////////////////////////////
/////ИСПОЛЬЗОВАНИЕ НА БЛОКЕ//////
////////////////////////////////

world.events.beforeItemUseOn.subscribe((data) => {
	if (data.item.typeId === "we:wand" && data.source instanceof Player) {
		const poss = WorldEditBuild.getPoses().p2;
		if (poss.x == data.blockLocation.x && poss.y == data.blockLocation.y && poss.z == data.blockLocation.z) return;
		SelectionBuild.setPos2(data.blockLocation.x, data.blockLocation.y, data.blockLocation.z);
		data.source.tell(
			`§d►2◄§f (использовать) ${data.blockLocation.x}, ${data.blockLocation.y}, ${data.blockLocation.z}` //§r
		);
	}
});

/////////////////////////
/////ИСПОЛЬЗОВАНИЕ//////
///////////////////////
world.events.beforeItemUse.subscribe((data) => {
	if (!(data.source instanceof Player)) return;
	if (data.item.typeId === "we:s") {
		let lore = data.item.getLore();
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
		const item = data.item;
		item.setLore(lore);
		XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
	}

	if (data.item.typeId != "we:brush") return;
	const sett = GetPlayerSettings(data.source);
	if (sett.enableMobile) return;
	const lore = data.item.getLore();
	const shape = lore[0]?.replace("Shape: ", "");
	const blocks = lore[1]?.replace("Blocks: ", "").split(",");
	const size = lore[2]?.replace("Size: ", "");
	const range = lore[3]?.replace("Range: ", "");
	if (!shape || !blocks || !size || !range) return;
	/** @type {import("@minecraft/server").BlockRaycastOptions} */
	const q = {};
	q.maxDistance = parseInt(range);
	const block = data.source.getBlockFromViewVector(q);
	if (block) new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
});
world.events.itemUse.subscribe((data) => {
	if (data.item.typeId.startsWith("l:")) {
		data.source.runCommandAsync(`tp ^^^5`);
	}
});

////////////////////////////
/////РАЗРУШЕНИЕ БЛОКА//////
//////////////////////////
world.events.blockBreak.subscribe((data) => {
	if (XA.Entity.getHeldItem(data.player)?.typeId != "we:wand") return;
	const poss = WorldEditBuild.getPoses().p2;
	if (poss.x == data.block.location.x && poss.y == data.block.location.y && poss.z == data.block.location.z) return;
	SelectionBuild.setPos1(data.block.location.x, data.block.location.y, data.block.location.z);
	data.player.tell(`§5►1◄§r (сломать) ${data.block.location.x}, ${data.block.location.y}, ${data.block.location.z}`);
	data.dimension.getBlock(data.block.location).setPermutation(data.brokenBlockPermutation);
});

setTickInterval(() => {
	WorldEditBuild.drawSelection();
}, 20);
