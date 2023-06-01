import { ActionForm, Database, InventoryStore } from "xapi.js";

/**
 * @type {Database<string, {invs: Record<string, string>}>}
 *
 */
const table = XA.tables.player;
const DB = Database.eventProxy(table, {
	beforeGet(key, value) {
		value ??= { invs: {} };
		value.invs ??= {};
		return value;
	},
	beforeSet(key, value) {
		if (!Object.keys(value.invs ?? {}).length) delete value.invs;
		return value;
	},
});
const STORE = new InventoryStore("inventories");

new XCommand({
	name: "inv",
	role: "moderator",
	description: "Управляет сохраненными инвентарями",
}).executes((ctx) => {
	const inventories = DB.get(ctx.sender.id).invs;
	const form = new ActionForm(
		"Inventories",
		"Выбери слот для выгрузки:"
	).addButton("Новый", null, () => {});

	for (const [key, value] of Object.entries(inventories)) {
		const inv = STORE.getEntityStore(key, false);
		let label = key;
		label += " ";
		if (Object.keys(inv.equipment).length) label += XA.Lang.emoji.armor;
		if (inv.slots.length) label += `(${inv.slots.length})`;
		form.addButton(label, null, () => {});
	}

	form.show(ctx.sender);
});
