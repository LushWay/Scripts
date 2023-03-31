/**
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {false | import("../../lib/Form/ActionForm.js").ActionForm}
 */
function example(player) {
	return false;
}

export const CONFIG_MENU = {
	itemId: "xa:menu",
	menu: example,
};

