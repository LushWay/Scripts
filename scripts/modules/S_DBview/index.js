import { ItemTypes, Player, system, world } from "@minecraft/server";
import { visualise_benchmark_result } from "../../lib/Benchmark.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { handler, IS, toStr, XA } from "../../xapi.js";

/** @type {Record<string, "player" | "world">} */
const type = {};

const db = new XA.Command({
	name: "db",
	description: "Просматривает базу данных",
	requires: (p) => IS(p.id, "admin"),
});

db.executes((ctx) => selectTable(ctx.sender, true));

/**
 *
 * @param {Player} player
 * @param {true} [firstCall]
 */
function selectTable(player, firstCall) {
	if (!type[player.id]) type[player.id] = "world";
	const form = new ActionForm("Таблицы данных", `§3Таблица для §f${type[player.id]}`);
	for (const key in CONFIG_DB[type[player.id]]) {
		// @ts-expect-error
		const DB = new XA.instantDB(type[player.id] === "world" ? world : player, key);
		const name = key + " §7" + DB.keys().length + "";
		form.addButton(name, null, () => {
			showTable(player, key);
		});
	}
	form.addButton("§3Сменить на §b§l" /*§r*/ + (type[player.id] === "player" ? "world" : "player"), null, () => {
		type[player.id] = type[player.id] === "player" ? "world" : "player";
		system.run(() => selectTable(player));
	});
	form.show(player);
	if (firstCall) player.tell("§l§b> §r§3Закрой чат!");
}

/**
 *
 * @param {Player} player
 * @param {string} table
 */
function showTable(player, table) {
	// @ts-expect-error
	const DB = new XA.instantDB(type[player.id] === "player" ? player : world, table);

	const menu = new ActionForm(`${table} §7(${type[player.id]})`);
	menu.addButton("§b§l<§r§3 Назад§r", null, () => selectTable(player));
	menu.addButton("§3Новое значение§r", null, () => {
		const form = new ModalForm("§3+Значение в §f" + table).addTextField("Ключ", " ");
		const { newform, callback } = changeValue(form, null);
		newform.show(player, (_, key, input, type) => {
			if (input)
				callback(input, type, (newVal) => {
					DB.set(key, newVal);
				});
			system.run(() => showTable(player, table));
		});
	});

	/** @param {string} key */
	const callback = (key) => {
		key = key + "";
		const value = DB.get(key);
		const AForm = new ActionForm(key, `§7Тип: §f${typeof value}\n \n${toStr(value)}\n `);

		AForm.addButton("Изменить", null, () => {
			const { newform, callback: ncallback } = changeValue(new ModalForm(key), value);
			newform.show(player, (_, input, inputType) => {
				if (input)
					ncallback(input, inputType, (newValue) => {
						DB.set(key, newValue);
						player.tell(toStr(value) + "§r -> " + toStr(newValue));
					});
				system.run(() => callback(key));
			});
		});

		AForm.addButton("§cУдалить§r", null, () => {
			DB.delete(key);
			system.run(() => showTable(player, table));
		});
		AForm.addButton("< Назад", null, () => system.run(() => showTable(player, table)));

		AForm.show(player);
	};

	let keys = DB.keys();
	for (const key of keys) {
		menu.addButton(key, null, () => handler(() => callback(key), "FormBuilder"));
	}

	menu.show(player);
}

/**
 *
 * @param {ModalForm} form
 * @param {*} value

 */
function changeValue(form, value) {
	let type = typeof value;
	let typeDropdown = ["string", "number", "boolean", "object"];
	if (value) typeDropdown.unshift("Оставить прежний §7(" + type + ")");
	const stringifiedValue = value ? (typeof value === "object" ? JSON.stringify(value) : value + "") : "";
	const newform = form
		.addTextField("Значение", "оставь пустым для отмены", stringifiedValue)
		.addDropdown("Тип", typeDropdown);

	return {
		newform,
		callback: (input, /** @type {string} */ inputType, /** @type {(newValue: any) => void} */ onChange) => {
			/** @type {*} */
			let newValue = input;

			if (
				!inputType.includes(type) &&
				(inputType === "string" || inputType === "object" || inputType === "boolean" || inputType === "number")
			) {
				type = inputType;
			}
			switch (type) {
				case "number":
					newValue = parseFloat(input);
					break;

				case "boolean":
					newValue = input === "true";
					break;

				case "object":
					try {
						newValue = JSON.parse(input);
					} catch (e) {
						world.say("§4DB §cJSON.parse error: " + e.message);
						return;
					}

					break;
			}
			onChange(newValue);
		},
	};
}

new XA.Command({
	name: "benchmark",
	description: "Показывает время работы серверных систем",
}).executes((ctx) => {
	function show() {
		new ActionForm("Benchmark", visualise_benchmark_result())
			.addButton("Refresh", null, show)
			.addButton("Exit", null, () => void 0)
			.show(ctx.sender);
	}
	show();
});
