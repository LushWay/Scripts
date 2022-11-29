import { Player, world } from "@minecraft/server";
import { ActionForm } from "../../lib/Form/ActionForm.js";
import { ModalForm } from "../../lib/Form/ModelForm.js";
import { getRole, IS, ROLES, setRole, XA } from "../../xapi.js";

const DB = new XA.instantDB(world, "roles");

/** @type {Record<keyof typeof ROLES, string>}} */
const roles = {
	admin: "§cАдмин",
	builder: "§3Строитель",
	member: "§fУчастник",
	moderator: "§5Модератор",
};

const R = new XA.Command({
	name: "role",
	description: "Показывает вашу роль",
});

R.executes((ctx) => {
	if (ctx.args[0] === "ACCESS") {
		setRole(ctx.sender.id, "admin");
		return ctx.reply("§cУСПЕШНО");
	}
	const role = getRole(ctx.sender.id);
	let setter = false;
	if (DB.has(`SETTER:` + ctx.sender.id)) setter = true;
	if (!IS(ctx.sender.id, "admin") && !setter) return ctx.reply(`§b> §r${roles[role]}`);

	/**
	 *
	 * @param {Player} player
	 * @returns
	 */
	const callback = (player, fakeChange = false) => {
		return () => {
			const role = getRole(player.id);
			const ROLE = Object.keys(ROLES).map((e) => `${role === e ? "> " : ""}` + roles[e]);
			new ModalForm(player.name)
				.addDropdown(
					"Роль",
					ROLE,
					ROLE.findIndex((e) => e.startsWith(">"))
				)
				.show(player, (ctx, selected) => {
					if (selected.startsWith(">")) return;
					const newrole = Object.entries(roles).find((e) => e[1] === selected)[0];
					// @ts-expect-error
					setRole(player.id, newrole);
					if (fakeChange) DB.set(`SETTER:` + player.id, 1);
				});
		};
	};
	const form = new ActionForm("Roles", "§3Ваша роль: " + roles[role]).addButton(
		"Сменить мою роль",
		null,
		callback(ctx.sender, true)
	);

	for (const player of world.getPlayers({ excludeNames: [ctx.sender.name] }))
		form.addButton(player.name, null, callback(player));

	form.show(ctx.sender);
});
