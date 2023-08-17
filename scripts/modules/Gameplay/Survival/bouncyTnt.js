import {
	EquipmentSlot,
	MinecraftEntityTypes,
	MinecraftItemTypes,
	Player,
	system,
	world,
} from "@minecraft/server";

world.beforeEvents.itemUse.subscribe((data) => {
	if (data.itemStack.typeId !== MinecraftItemTypes.tnt.id) return;
	if (!(data.source instanceof Player)) return;
	data.cancel = true;

	system.run(() => {
		if (!(data.source instanceof Player)) return;

		const tnt = data.source.dimension.spawnEntity(
			MinecraftEntityTypes.tnt.id,
			data.source.location
		);
		const tntSlot = data.source
			.getComponent("equipment_inventory")
			.getEquipmentSlot(EquipmentSlot.mainhand);

		if (tntSlot.amount === 1) tntSlot.setItem(undefined);
		else tntSlot.amount--;

		tnt.applyImpulse(data.source.getViewDirection());
		data.source.playSound("camera.take_picture", { volume: 4, pitch: 0.9 });
	});
});
