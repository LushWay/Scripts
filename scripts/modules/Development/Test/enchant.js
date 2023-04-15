import {
	EquipmentSlot,
	MinecraftEnchantmentTypes,
	world,
} from "@minecraft/server";
import { Enchantments } from "../../Gameplay/Enchantments/index.js";

new XA.Command({
	name: "enchant",
	description: "Зачаровывает предмет",
})
	.array("enchantName", Object.keys(MinecraftEnchantmentTypes), true)
	.int("level", true)
	.executes((ctx, enchant, level) => {
		if (!enchant)
			return ctx.reply(Object.keys(MinecraftEnchantmentTypes).join("\n"));
		// @ts-expect-error
		const ench = MinecraftEnchantmentTypes[enchant];

		const mainhand = ctx.sender
			.getComponent("equipment_inventory")
			.getEquipmentSlot(EquipmentSlot.mainhand);

		const item = mainhand.getItem();
		const { enchantments } = item.getComponent("enchantments");
		enchantments.removeEnchantment(ench);
		enchantments.addEnchantment(Enchantments.Custom[ench.id][level]);

		world.debug("enca", [...enchantments]);
		item.getComponent("enchantments").enchantments = enchantments;

		mainhand.setItem(item);
	});
