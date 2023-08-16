import { ItemLockMode, ItemStack } from "@minecraft/server";
import { ActionForm, MessageForm } from "xapi.js";

const item = new ItemStack("xa:menu");
item.lockMode = ItemLockMode.inventory;
item.setLore([
	"§r§7Для открытия возьми в руку и",
	"§r§7зажми на телефоне, лкм на пк",
]);

export const MENU = {
	item,
	/**
	 *
	 * @param {import("@minecraft/server").Player} player
	 * @returns {false | ActionForm}
	 */
	OnOpen(player) {
		new MessageForm(
			"Меню выключено",
			"Модули не запрашивали настройку меню."
		).show(player);

		return false;
	},
};
