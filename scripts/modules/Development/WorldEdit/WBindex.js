import {
	EquipmentSlot,
	Player,
	system,
	Vector,
	world,
} from "@minecraft/server";

// Lazy load to prevent script spike
system.runTimeout(
	() => {
		import("./commands/index.js");
	},
	"command import",
	100
);

import { Options } from "xapi.js";
import { FillFloor } from "./builders/FillBuilder.js";
import "./builders/ToolBuilder.js";
import { WorldEditBuild } from "./builders/WorldEditBuilder.js";
import { CONFIG_WE } from "./config.js";

export const WorldEditPlayerSettings = Options.player("Строитель мира", "we", {
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

system.runPlayerInterval(
	(p) => {
		const i = p
			.getComponent("equipment_inventory")
			.getEquipmentSlot(EquipmentSlot.mainhand);
		const settings = WorldEditPlayerSettings(p);
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
			if (range && false) {
				q.maxDistance = parseInt(range);
				const raycast = p.getBlockFromViewDirection(q);
				if (raycast) {
					const { block } = raycast;
					const ent1 = block.dimension.getEntitiesAtBlockLocation(
						block.location
					);
					if (!ent1) {
						world.overworld.runCommand(
							`event entity @e[type=f:t,name="${CONFIG_WE.BRUSH_LOCATOR}",tag="${p.name}"] kill`
						);
						world.overworld.runCommand(
							`summon f:t ${block.location.x} ${
								block.location.y - CONFIG_WE.H
							} ${block.location.z} spawn "${CONFIG_WE.BRUSH_LOCATOR}"`
						);
						world.overworld.runCommand(
							`tag @e[x=${block.location.x},y=${
								block.location.y - CONFIG_WE.H
							},z=${block.location.z},r=1,type=f:t,name="${
								CONFIG_WE.BRUSH_LOCATOR
							}"] add "${p.name}"`
						);
					}
					for (let ent of ent1) {
						if (ent.id == "f:t" && ent.nameTag == CONFIG_WE.BRUSH_LOCATOR)
							break;
						world.overworld.runCommand(
							`event entity @e[type=f:t,name="${CONFIG_WE.BRUSH_LOCATOR}",tag="${p.name}"] kill`
						);
						world.overworld.runCommand(
							`summon f:t ${block.location.x} ${
								block.location.y - CONFIG_WE.H
							} ${block.location.z} spawn "${CONFIG_WE.BRUSH_LOCATOR}"`
						);
						world.overworld.runCommand(
							`tag @e[x=${block.location.x},y=${
								block.location.y - CONFIG_WE.H
							},z=${block.location.z},r=1,type=f:t,name="${
								CONFIG_WE.BRUSH_LOCATOR
							}"] add "${p.name}"`
						);
						break;
					}
				}
			}
		} else {
			world.overworld.runCommand(
				`event entity @e[type=f:t,name="${CONFIG_WE.BRUSH_LOCATOR}",tag="${p.name}"] kill`
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
	"we Main",
	10
);

system.runInterval(
	() => {
		WorldEditBuild.drawSelection();
	},
	"we Selection",
	20
);

world.beforeEvents.itemUseOn.subscribe((data) => {
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
		`§d►2◄§f (use) ${Vector.string(WorldEditBuild.pos2)}` //§r
	);
});

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
	if (itemStack.typeId === "we:dash") {
		source.teleport(
			Vector.add(source.location, Vector.multiply(source.getViewDirection(), 5))
		);
	}
});

world.afterEvents.blockBreak.subscribe((event) => {
	if (
		event.player
			.getComponent("equipment_inventory")
			.getEquipmentSlot(EquipmentSlot.mainhand)?.typeId !== "we:wand"
	)
		return;

	const pos = WorldEditBuild.pos1 ?? { x: 0, y: 0, z: 0 };
	if (
		pos.x === event.block.location.x &&
		pos.y === event.block.location.y &&
		pos.z === event.block.location.z
	)
		return;

	WorldEditBuild.pos1 = event.block.location;
	event.player.tell(`§5►1◄§r (break) ${Vector.string(WorldEditBuild.pos1)}`);

	event.dimension
		.getBlock(event.block.location)
		.setPermutation(event.brokenBlockPermutation);
});
