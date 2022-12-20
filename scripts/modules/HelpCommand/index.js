import { getRole, ROLES, toStr, XA } from "xapi.js";
import { XCommand } from "../../lib/Command/Command.js";
import { __COMMANDS__ } from "../../lib/Command/index.js";
import { commandNotFound, noPerm } from "../../lib/Command/utils.js";

/**
 * @param {XCommand} command
 * @returns {string[]}
 */
function getUsage(command) {
	return [getType(command.parent), getType(command), ...command.children.map(getType)];
}

/**
 *
 * @param {XCommand} command
 */
function childrensToHelpText(command) {
	const _ = [];
	for (const children of command.children) {
		if (children.children.length < 1) _.push(children);
		else _.push(...childrensToHelpText(children));
	}
	return _;
}

/**
 *
 * @param {XCommand} command
 */
function getParentType(command) {
	let curtype = getType(command);
	if (command.depth === 0) return curtype;
	else return `${getParentType(command.parent)} ${curtype}`;
}
/**
 * const path = getUsage(command);
		const _ = `§7   §f-${path.join(" ")}§7§o - ${command.data.description ?? "Мы не знаем что оно делает"}§r`;
 */

/**
 *
 * @param {XCommand} o
 * @returns
 */
function getType(o) {
	const t = o.type;
	const q = t.optional;

	if (t.typeName === "literal") return `${q ? "§7" : "§f"}${t.name}`;
	return `${q ? `§7[${o.type.name}: §7${o.type.typeName}§7]` : `§6<${o.type.name}: §6${o.type.typeName}§6>`}`;
}

const help = new XA.Command({
	name: "help",
	description: "Выводит список команд",
	aliases: ["?", "h"],
});

/** @type {Record<keyof typeof ROLES, string>}} */
const colors = {
	admin: "§c",
	builder: "§3",
	member: "§2",
	moderator: "§5", //§r
};

help
	.int("page", true)
	.int("commandsInPage", true)
	.executes((ctx, inputPage, commandsInPage) => {
		const avaibleCommands = __COMMANDS__.filter((e) => e.data.requires(ctx.sender));
		const cmds = commandsInPage || 15;
		const maxPages = Math.ceil(avaibleCommands.length / cmds);
		const page = Math.min(inputPage || 1, maxPages);
		const path = avaibleCommands.slice(page * cmds - cmds, page * cmds);

		const cv = colors[getRole(ctx.sender.id)];

		ctx.reply(`§ы${cv}─═─═─═─═─═ §r${page}/${maxPages} ${cv}═─═─═─═─═─═─`);

		for (const command of path) {
			const q = "§f-";
			let c = `${cv}§r ${q}${command.data.name} §o§7- ${
				command.data.description ? `${command.data.description}` : " Пусто" //§r
			}`;
			ctx.reply("§ы" + c);
		}
		ctx.reply(`${cv}─═─═─═§f Доступно: ${avaibleCommands.length}/${__COMMANDS__.length} ${cv}═─═─═─═─`);
	});

help.string("commandName").executes((ctx, commandName) => {
	/**
	 * @type {XCommand}
	 */
	const cmd = __COMMANDS__.find((e) => e.data.name == commandName || e.data?.aliases?.includes(commandName));

	if (!cmd) return commandNotFound(ctx.sender, commandName);
	if (!cmd.data?.requires(ctx.data.sender)) return noPerm(ctx.data.sender, cmd), "fail";

	const d = cmd.data;
	const aliases = d.aliases?.length > 0 ? "§7(также §f" + d.aliases.join("§7, §f") + "§7)§r" : "";
	const str = `   §fКоманда §6-${d.name} ${aliases}`;

	ctx.reply(`§7§ы┌──`);
	ctx.reply(str);
	ctx.reply(" ");

	let l = str.length;

	// for (const command of childrensToHelpText(cmd)) {
	// 	const path = getUsage(command);
	// 	const _ = `§7   §f-${path.join(" ")}§7§o - ${command.data.description}§r`;
	// 	l = Math.max(l, _.length);
	// 	ctx.reply(_);
	// }
	ctx.reply(`${new Array(l - 2).join(" ")}§7§ы──┘`);
	ctx.reply(toStr(childrensToHelpText(cmd).map(getParentType)));
	return;
});

const testCMD = new XA.Command({
	name: "owo",
});

testCMD.executes(() => {});

testCMD.int("i").int("i").string("s");

const l2 = testCMD.string("LL");
l2.string("ls");
l2.int("li");

const literal = testCMD.literal({ name: "literal" });

literal.int("i").int("i").string("s");

const ll2 = literal.int("i").string("s").string("s");
ll2.string("ls");
ll2.int("li");
