import { Player, system, world } from "@minecraft/server";
import { Database } from "../../lib/Database/Rubedo.js";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { BECHMARK_RESULTS } from "../../lib/XBenchmark.js";
import { handle, TIMERS_PATHES, toStr, XA } from "../../xapi.js";

/**
 * @typedef {import("../../lib/Database/Rubedo.js").Database<string, any>} defDB
 */

const db = new XA.Command({
	name: "db",
	description: "Просматривает базу данных",
	role: "admin",
});

db.executes((ctx) => selectTable(ctx.sender, true));

/**
 *
 * @param {Player} player
 * @param {true} [firstCall]
 */
function selectTable(player, firstCall) {
	const form = new ActionForm("Таблицы данных");
	for (const key in Database.instances) {
		/** @type {defDB} */
		const DB = Database.instances[key];
		const name = `${key} §7${DB.keys().length}§r`;
		form.addButton(name, null, () => {
			showTable(player, key);
		});
	}
	form.show(player);
	if (firstCall) player.tell("§l§b> §r§3Закрой чат!");
}

/**
 *
 * @param {Player} player
 * @param {string} table
 */
function showTable(player, table) {
	/** @type {defDB} */
	const DB = Database.instances[table];

	const menu = new ActionForm(`${table}`);
	menu.addButton("§b§l<§r§3 Назад§r", null, () => selectTable(player));
	menu.addButton("§3Новое значение§r", null, () => {
		const form = new ModalForm("§3+Значение в §f" + table).addTextField(
			"Ключ",
			" "
		);
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

		const AForm = new ActionForm(
			key,
			`§7Тип: §f${typeof value}\n \n${toStr(value)}\n `
		);

		AForm.addButton("Изменить", null, () => {
			const { newform, callback: ncallback } = changeValue(
				new ModalForm(key),
				value
			);
			newform.show(player, (_, input, inputType) => {
				if (input)
					ncallback(input, inputType, (newValue) => {
						DB.set(key, newValue);
						player.tell(toStr(value) + "§r -> " + toStr(newValue));
					});
				callback(key);
			});
		});

		AForm.addButton("§cУдалить§r", null, () => {
			DB.delete(key);
			system.run(() => showTable(player, table));
		});
		AForm.addButton("< Назад", null, () =>
			system.run(() => showTable(player, table))
		);

		system.run(() => AForm.show(player));
	};

	let keys = DB.keys();
	for (const key of keys) {
		menu.addButton(key, null, () => handle(() => callback(key), "FormBuilder"));
	}

	menu.show(player);
}

/**
 *
 * @param {ModalForm<(args_0: any, args_1: string) => void>} form
 * @param {*} value
 */
function changeValue(form, value) {
	let type = typeof value;
	let typeDropdown = ["string", "number", "boolean", "object"];
	if (value) typeDropdown.unshift("Оставить прежний §7(" + type + ")");
	const stringifiedValue = value
		? typeof value === "object"
			? JSON.stringify(value)
			: value + ""
		: "";
	const newform = form
		.addTextField("Значение", "оставь пустым для отмены", stringifiedValue)
		.addDropdown("Тип", typeDropdown);

	return {
		newform,
		callback: (
			/** @type {*} */ input,
			/** @type {string} */ inputType,
			/** @type {(newValue: any) => void} */ onChange
		) => {
			let newValue = input;

			if (
				!inputType.includes(type) &&
				(inputType === "string" ||
					inputType === "object" ||
					inputType === "boolean" ||
					inputType === "number")
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

/**
 * It takes the benchmark results and sorts them by average time, then it prints them out in a nice
 * format
 * @returns A string.
 */
export function visualise_benchmark_result({
	type = "test",
	timer_pathes = false,
} = {}) {
	let output = "";
	let res = [];
	for (const [key, val] of Object.entries(BECHMARK_RESULTS[type])) {
		const total_count = val.length;
		const total_time = val.reduce((p, c) => p + c);
		const average = total_time / total_count;

		res.push({ key, total_count, total_time, average });
	}

	res = res.sort((a, b) => a.average - b.average);

	for (const { key, total_count, total_time, average } of res) {
		/** @type {[number, string][]} */
		const style = [
			[0.1, "§a"],
			[0.3, "§2"],
			[0.5, "§g"],
			[0.65, "§6"],
			[0.8, "§c"],
		];

		const cur_style = style.find((e) => e[0] > average)?.[1] ?? "§4";
		const isPath = timer_pathes && key in TIMERS_PATHES;

		output += `§3Label §f${key}§r\n`;
		output += `§3| §7average: ${cur_style}${average.toFixed(2)}ms\n`;
		output += `§3| §7total time: §f${total_time}ms\n`;
		output += `§3| §7call count: §f${total_count}\n`;
		if (isPath) output += `§3| §7path: §f${getPath(key)}\n`;
		output += "\n\n";
	}
	return output;
}

/**
 *
 * @param {string} key
 */
function getPath(key) {
	("\n" + TIMERS_PATHES[key]).replace(/\n/g, "\n§3| §f");
}

new XA.Command({
	name: "benchmark",
	description: "Показывает время работы серверных систем",
	role: "admin",
})
	.string("type", true)
	.boolean("pathes", true)
	.executes((ctx, type, pathes) => {
		if (type && !(type in BECHMARK_RESULTS))
			return ctx.error(
				"Неизвестный тип бенчмарка! Доступные типы: \n  §f" +
					Object.keys(BECHMARK_RESULTS).join("\n  ")
			);

		function show() {
			new ActionForm(
				"Benchmark",
				visualise_benchmark_result({
					type: type ?? "timers",
					timer_pathes: pathes ?? false,
				})
			)
				.addButton("Refresh", null, show)
				.addButton("Exit", null, () => void 0)
				.show(ctx.sender);
		}
		show();
	});

