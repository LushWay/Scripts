import { Player, world } from "@minecraft/server";
import { OPTIONS } from "lib/Class/Options.js";
import { Database } from "lib/Database/Rubedo.js";
import { ActionForm } from "lib/Form/ActionForm.js";
import { ModalForm } from "lib/Form/ModelForm.js";
import { ROLES, ROLES_NAMES as TR, XA, getRole, setRole, toStr } from "xapi.js";

/** @type {Database<string, {role: keyof typeof ROLES, setter?: 1}>} */
const DB = XA.tables.player;

const R = new XA.Command({
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
				// @ts-expect-error
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

world.events.itemUse.subscribe(async ({ source: player, itemStack }) => {
	if (itemStack.typeId !== "xa:admin" || !(player instanceof Player)) return;
	options(player);
});

new XA.Command({
	name: "options",
	role: "admin",
	description: "Настройки мира",
}).executes((ctx) => {
	options(ctx.sender);
});

/**
 *
 * @param {Player} player
 */
function options(player) {
	const form = new ActionForm("§dНастройки мира");

	for (const groupName in OPTIONS) {
		form.addButton(groupName, null, () => {
			group(player, groupName);
		});
	}

	form.show(player);
}

/** @type {import("lib/Class/Options.js").OPTIONS_DB} */
const OPTIONS_DB = new Database("options");

/**
 *
 * @param {Player} player
 * @param {string} groupName
 */
function group(player, groupName) {
	const config = OPTIONS[groupName];
	const data = OPTIONS_DB.get(groupName);
	/** @type {[string, () => void][]} */
	const buttons = [];
	const form = new ActionForm(
		groupName,
		Object.entries(config)
			.map(([KEY, OPTION]) => {
				const value = data[KEY];
				buttons.push([
					KEY,
					function edit(mesasge = "") {
						const displayValue = value ?? "§8<не установлено>";
						new ModalForm(`${groupName} - ${KEY}`)
							.addTextField(
								`${mesasge}§f${OPTION.desc}§r\n \n §7Значение: ${
									typeof displayValue === "string"
										? displayValue
										: toStr(displayValue)
								}\n §7Дефолт: ${toStr(
									OPTION.value
								)}§r\n §7Тип: §f${typeof OPTION.value}\n \n `,
								"Оставьте пустым для отмены",
								`${value ?? OPTION.value}`
							)
							.show(player, (ctx, input) => {
								if (input) {
									let total;
									switch (typeof OPTION.value) {
										case "string":
											total = input;
											break;
										case "number":
											total = Number(input);
											if (isNaN(total)) return edit("§cВведите число!");
											break;
										case "boolean":
											total = input === "true";
											break;
									}

									data[KEY] = total;
									OPTIONS_DB.set(groupName, data);
									group(player, groupName);
								}
							});
					},
				]);

				let button = "";

				button += `§f${KEY}§7 - ${OPTION.desc}§r`;
				if (value) button += `\n §iЗначение: ${toStr(value)}`;
				button += `\n §iДефолт: ${toStr(OPTION.value)}§r\n \n \n`;

				return button;
			})
			.join("")
	);

	form.addButton("< Назад", null, () => options(player));
	for (const [key, callback] of buttons) form.addButton(key, null, callback);
	form.show(player);
}
