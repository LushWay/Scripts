import { ItemLockMode, ItemStack, Player, world } from "@minecraft/server";
import { XEntity, util } from "xapi.js";
import { MENU } from "./var.js";

world.afterEvents.itemUse.subscribe(async ({ source: player, itemStack }) => {
	if (itemStack.typeId !== MENU.item.typeId || !(player instanceof Player))
		return;
	util.handle(() => {
		const menu = MENU.OnOpen(player);
		if (menu === false) return;
		menu.show(player);
	});
});

new XCommand({
	name: "menu",
	description: "Выдает/убирает меню из инвентаря",
	type: "public",
}).executes(async (ctx) => {
	if (await XEntity.hasItem(ctx.sender, 0, MENU.item.typeId)) {
		ctx.sender.runCommandAsync(`clear @s ${MENU.item}`);
		ctx.reply("§c- §3Меню");
	} else {
		const item = MENU.GetItem(ctx.sender);

		ctx.sender.getComponent("inventory").container.addItem(item);
		ctx.reply("§a+ §3Меню");
	}
});
