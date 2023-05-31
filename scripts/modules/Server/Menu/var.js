import { ActionForm, MessageForm } from "xapi.js";

/**
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {false | ActionForm}
 */
function example(player) {
	new MessageForm(
		"Меню выключено",
		"Модули не запрашивали настройку меню."
	).show(player);

	return false;
}

export const CONFIG_MENU = {
	itemId: "xa:menu",
	menu: example,
};
