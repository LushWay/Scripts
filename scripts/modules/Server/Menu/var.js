import { ItemLockMode, ItemStack, Player } from "@minecraft/server";
import { ActionForm, MessageForm } from "xapi.js";

export const MENU = {
	item: new ItemStack("xa:menu"),
	/**
	 *
	 * @param {Player} player
	 * @returns
	 */
	GetItem(player = null, option = false) {
		const item = this.item.clone();
		item.lockMode = ItemLockMode.inventory;
		item.setLore([
			"§r§7Для открытия возьми в руку и",
			"§r§7зажми на телефоне, лкм на пк",
		]);
		return item;
	},
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
