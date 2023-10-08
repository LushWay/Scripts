import { Player, Vector, world } from "@minecraft/server";
import { WorldEditTool } from "../../builders/ToolBuilder.js";
import { WorldEditBuild } from "../../builders/WorldEditBuilder.js";

const wand = new WorldEditTool({
	name: "wand",
	displayName: "топор",
	itemStackId: "we:wand",
});

world.beforeEvents.itemUseOn.subscribe((event) => {
	if (event.itemStack.typeId !== wand.item || !(event.source instanceof Player))
		return;

	const blockLocation = event.block;
	const pos = WorldEditBuild.pos2 ?? { x: 0, y: 0, z: 0 };
	if (
		pos.x === blockLocation.x &&
		pos.y === blockLocation.y &&
		pos.z === blockLocation.z
	)
		return;
	WorldEditBuild.pos2 = blockLocation;
	event.source.tell(
		`§d►2◄§f (use) ${Vector.string(WorldEditBuild.pos2)}`, //§r
	);
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
	if (event.itemStack?.typeId !== wand.item) return;

	const pos = WorldEditBuild.pos1 ?? { x: 0, y: 0, z: 0 };
	if (
		pos.x === event.block.location.x &&
		pos.y === event.block.location.y &&
		pos.z === event.block.location.z
	)
		return;

	WorldEditBuild.pos1 = event.block.location;
	event.player.tell(`§5►1◄§r (break) ${Vector.string(WorldEditBuild.pos1)}`);

	event.cancel = true;
});
