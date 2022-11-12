import { getRole, ROLES, XA } from "xapi.js";

const roles = {
	0: "Игрок",
	1: "§cАдмин",
	2: "§9Модератор",
	3: "§6Строитель",
};

new XA.Command({
	name: "role",
	description: "Показывает вашу роль",
}).executes((ctx) => {
	ctx.reply("§9► §fВаша роль: " + roles[ROLES[getRole(ctx.sender)]]);
});
