import { world } from "@minecraft/server";

world.events.blockBreak.subscribe((data) => {
	if (data.brokenBlockPermutation.type.id !== "minecraft:chest") return;

	data.block.setPermutation(data.brokenBlockPermutation);
	const { container } = data.block.getComponent("inventory");

	data.dimension
		.getEntities({
			location: data.block.location,
			maxDistance: 2,
			type: "minecraft:item",
		})
		.forEach((e) => {
			container.addItem(e.getComponent("item").itemStack);
			e.kill();
		});
});
