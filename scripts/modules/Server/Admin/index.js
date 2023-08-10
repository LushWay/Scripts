import { ItemStack, Player, system, world } from "@minecraft/server";
import { OPTIONS_NAME, Options } from "lib/Class/Options.js";
import { Database } from "lib/Database/Rubedo.js";
import { ActionForm } from "lib/Form/ActionForm.js";
import { ModalForm } from "lib/Form/ModelForm.js";
import {
	FormCallback,
	ROLES,
	ROLES_NAMES as TR,
	XA,
	XCommand,
	XEntity,
	getRole,
	setRole,
	util,
} from "xapi.js";

/** @type {Database<string, {role: keyof typeof ROLES, setter?: 1}>} */
const DB = XA.tables.player;

const R = new XCommand({
	name: "role",
	description: "Показывает вашу роль",
});

R.executes((ctx) => {
	const role = getRole(ctx.sender.id);
	const noAdmins = !DB.values()
		.map((e) => e.role)
		.includes("admin");
	const isAdmin = role === "admin";
	const needAdmin = ctx.args[0] === "ACCESS";
	const beenAdmin = DB.get(ctx.sender.id).setter && !isAdmin;

	if (noAdmins && ctx.sender.isOp() && (needAdmin || beenAdmin)) {
		const { data, save } = DB.work(ctx.sender.id);
		data.role = "admin";
		delete data.setter;
		save();
		return ctx.reply("§b> §3Вы получили роль §r" + TR.admin);
	}

	if (!isAdmin) return ctx.reply(`§b> §r${TR[role]}`);

	/**
	 *
	 * @param {Player} player
	 * @returns
	 */
	const callback = (player, fakeChange = false) => {
		return () => {
			const role = getRole(player.id);
			const ROLE = Object.keys(ROLES).map(
				(e) => `${role === e ? "> " : ""}` + TR[e]
			);
			new ModalForm(player.name)
				.addToggle("Уведомлять", false)
				.addToggle("Показать Ваш ник в уведомлении", false)
				.addDropdown(
					"Роль",
					ROLE,
					ROLE.findIndex((e) => e.startsWith(">"))
				)
				.addTextField("Причина смены роли", `Например, "космокс"`)
				.show(ctx.sender, (_, notify, showName, selected, message) => {
					if (selected.startsWith(">")) return;
					const newrole = Object.entries(TR).find((e) => e[1] === selected)[0];
					if (notify)
						player.tell(
							`§b> §3Ваша роль сменена c ${TR[role]} §3на ${selected}${
								showName ? `§3 игроком §r${ctx.sender.name}` : ""
							}${message ? `\n§r§3Причина: §r${message}` : ""}`
						);
					// @ts-expect-error
					setRole(player.id, newrole);
					if (fakeChange) {
						const { data, save } = DB.work(player.id);
						// @ts-expect-error
						data.role = newrole;
						data.setter = 1;
						save();
					}
				});
		};
	};
	const form = new ActionForm("Roles", "§3Ваша роль: " + TR[role]).addButton(
		"Сменить мою роль",
		null,
		callback(ctx.sender, true)
	);

	for (const player of world.getPlayers({ excludeNames: [ctx.sender.name] }))
		form.addButton(player.name, null, callback(player));

	form.show(ctx.sender);
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
	if (event.id === "ROLE:ADMIN") {
		const player = XEntity.fetch(event.message);
		if (!player) console.warn("(SCRIPTEVENT::ROLE:ADMIN) PLAYER NOT FOUND");

		setRole(player, "admin");
	}
});

new XCommand({
	name: "options",
	role: "member",
	description: "Настройки",
}).executes((ctx) => {
	poptions(ctx.sender);
});

/**
 * @param {Player} player
 */
function poptions(player) {
	const form = new ActionForm("§dНастройки");

	for (const groupName in Options.PLAYER) {
		const name = Options.PLAYER[groupName][OPTIONS_NAME];
		form.addButton(name, null, () => {
			group(player, groupName, "PLAYER");
		});
	}

	form.show(player);
}

new XCommand({
	name: "wsettings",
	role: "admin",
	description: "Настройки мира",
}).executes((ctx) => {
	options(ctx.sender);
});

/**
 * @param {Player} player
 */
function options(player) {
	const form = new ActionForm("§dНастройки мира");

	for (const groupName in Options.WORLD) {
		const data = OPTIONS_DB.get(groupName);
		const requires = Object.entries(Options.WORLD[groupName]).reduce(
			(count, [key, option]) =>
				option.requires && typeof data[key] === "undefined" ? count + 1 : count,
			0
		);
		form.addButton(
			`${groupName}${requires ? ` §c(${requires}!)` : ""}`,
			null,
			() => {
				group(player, groupName, "WORLD");
			}
		);
	}

	form.show(player);
}

/** @type {import("lib/Class/Options.js").OPTIONS_DB} */
const OPTIONS_DB = new Database("options");

/**
 *
 * @param {Player} player
 * @param {string} groupName
 * @param {"PLAYER" | "WORLD"} groupType
 * @param {Record<string, string>} [errors]
 */
function group(player, groupName, groupType, errors = {}) {
	const source = groupType === "PLAYER" ? Options.PLAYER : Options.WORLD;
	const config = source[groupName];
	const name = config[OPTIONS_NAME];
	const data = OPTIONS_DB.get(groupName);

	/** @type {[string, (input: string | boolean) => string][]} */
	const buttons = [];
	/** @type {ModalForm<(ctx: FormCallback, ...options: any) => void>} */
	const form = new ModalForm(name ?? groupName);

	for (const KEY in config) {
		const OPTION = config[KEY];
		const dbValue = data[KEY];
		const isDef = typeof dbValue === "undefined";
		const message = errors[KEY] ? `${errors[KEY]}\n` : "";
		const requires =
			Reflect.get(config[KEY], "requires") && typeof dbValue === "undefined";

		const value = dbValue ?? OPTION.value;
		const toggle = typeof value === "boolean";

		let label = toggle ? "" : "\n";
		label += message;
		if (requires) label += "§c(!) ";
		label += `§f${OPTION.name}`; //§r
		if (OPTION.desc) label += `§i - ${OPTION.desc}`;

		if (toggle) {
			if (isDef) label += `\n §8(По умолчанию)`;
			label += "\n ";
		} else {
			label += `\n   §7Значение: ${str(dbValue ?? OPTION.value)}`;
			label += `${isDef ? ` §8(По умолчанию)` : ""}\n`;

			label += `   §7Тип: §f${Types[typeof value] ?? typeof value}`;
		}

		if (toggle) form.addToggle(label, value);
		else
			form.addTextField(
				label,
				"Настройка не изменится",
				typeof value === "string" ? value : JSON.stringify(value)
			);

		buttons.push([
			KEY,
			(input) => {
				let total;
				if (typeof input !== "undefined") {
					if (typeof input === "boolean") total = input;
					else
						switch (typeof OPTION.value) {
							case "string":
								total = input;
								break;
							case "number":
								total = Number(input);
								if (isNaN(total)) return "§cВведите число!";
								break;
							case "object":
								try {
									total = JSON.parse(input);
								} catch (error) {
									return `§c${error.message}`;
								}
								break;
						}

					if (str(data[KEY]) === str(total)) return;
					data[KEY] = total;
					OPTIONS_DB.set(groupName, data);
					return "§aСохранено!";
				}
			},
		]);
	}

	form.show(player, (ctx, ...options) => {
		/** @type {Record<string, string>} */
		const messages = {};
		for (const [i, option] of options.entries()) {
			const [KEY, callback] = buttons[i];
			const result = callback(option);
			if (result) messages[KEY] = result;
		}

		if (Object.keys(messages).length)
			group(player, groupName, groupType, messages);
		else {
			if (groupType === "PLAYER") poptions(player);
			else options(player);
		}
	});
}
ItemStack;

/** @type {Partial<Record<AllTypes, string>>} */
const Types = {
	string: "Строка",
	number: "Число",
	object: "JSON-Объект",
	boolean: "Переключатель",
};

/**
 * @param {any} value
 */
function str(value) {
	if (typeof value === "string") return value;
	return util.inspect(value);
}
