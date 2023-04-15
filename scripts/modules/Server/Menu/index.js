import { ItemLockMode, ItemStack, Player, world } from "@minecraft/server";
import { XA, handle } from "xapi.js";
import { CONFIG_MENU } from "./var.js";

world.events.itemUse.subscribe(async ({ source: player, itemStack }) => {
	if (itemStack.typeId !== CONFIG_MENU.itemId || !(player instanceof Player))
		return;
	handle(() => {
		const menu = CONFIG_MENU.menu(player);
		if (menu === false) return;
		menu.show(player);
	});
});

new XA.Command({
	name: "menu",
	description: "Выдает/убирает меню из инвентаря",
	type: "public",
}).executes(async (ctx) => {
	if (await XA.Entity.hasItem(ctx.sender, 0, CONFIG_MENU.itemId)) {
		ctx.sender.runCommandAsync(`clear @s ${CONFIG_MENU.itemId}`);
		ctx.reply("§c- §3Меню");
	} else {
		const item = new ItemStack(CONFIG_MENU.itemId);
		item.lockMode = ItemLockMode.inventory;
		item.setLore([
			"§r§7Для открытия возьми в руку и",
			"§r§7зажми на телефоне, лкм на пк",
		]);

		ctx.sender.getComponent("inventory").container.addItem(item);
		ctx.reply("§a+ §3Меню");
	}
});
