import { ItemLockMode, ItemStack, Player, world } from "@minecraft/server";
import { handle, XA } from "xapi.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { CONFIG_MENU } from "./var.js";
CONFIG_MENU.menu ?? (CONFIG_MENU.menu = defaultmenu);
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
    if (item.typeId !== CONFIG_MENU.itemId || !(player instanceof Player))
        return;
    handle(() => {
        const menu = CONFIG_MENU.menu(player);
        if (menu === false)
            return;
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
    }
    else {
        const item = new ItemStack(CONFIG_MENU.itemId);
        item.lockMode = ItemLockMode.inventory;
        item.setLore([
            "Для открытия возьми в руку и",
            "зажми на телефоне, лкм на пк",
        ]);
        ctx.sender.getComponent("inventory").container.addItem(item);
        ctx.reply("§a+ §3Меню");
    }
});
