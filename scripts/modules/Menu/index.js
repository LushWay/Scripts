import { Player, world } from "@minecraft/server";
import { handle, XA } from "xapi.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { CONFIG_MENU } from "./var.js";

/**
 *
 * @param {Player} player
 * @returns
 */
function defaultmenu(player) {
	const e = new ActionForm("Пустое меню", "Кодер его еще не сделал").addButton("Да", null, () => void 0);
	return e;
}

world.events.beforeItemUse.subscribe(async ({ source: player, item }) => {
	if (item.typeId !== CONFIG_MENU.itemId || !(player instanceof Player)) return;
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
		ctx.sender.runCommandAsync(`give @s ${CONFIG_MENU.itemId} 1 0 {"item_lock":{"mode":"lock_in_inventory"}}`);
		ctx.reply("§a+ §3Меню");
	}
});
