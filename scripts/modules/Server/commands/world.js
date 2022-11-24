import { wo, WORLDOPTIONS } from "../../../lib/Class/XOptions.js";

import { XA } from "xapi.js";
const opt = new XA.Command({
	name: "world",
	description: "Настройки мира",
	requires: (p) => p.hasTag("owner"),
}).executes((ctx) => {
	ctx.reply("§7► §fAvaible options §7◄");
	for (let opt of WORLDOPTIONS) {
		ctx.reply(` §7[${wo.Q(opt.name) ? "§a+" : "§c-"}§7] §f${opt.name} §o§7- ${opt.desc}§r`);
	}
	ctx.reply("§7► §f---------- §7◄");
});
opt.literal({ name: "act" }).executes((ctx) => {
	ctx.reply("§2► §fActive options §2◄");
	for (let opt of WORLDOPTIONS) {
		if (wo.Q(opt.name)) ctx.reply(` §a-§f${opt.name} §o§7- ${opt.desc}§r`);
	}
	ctx.reply("§2► §f----------- §2◄");
});
opt
	.literal({ name: "ch" })
	.string("optionName")
	.executes((ctx, optionName) => {
		const ret = wo.change(optionName);
		switch (ret[0]) {
			case "no":
				ctx.reply("§c" + optionName);
			case "removed":
				ctx.reply(` §7[§c-§7] §f${ret[1].name} §o§7- ${ret[1].desc}§r`);
				break;
			case "added":
				ctx.reply(` §7[§a+§7] §f${ret[1].name} §o§7- ${ret[1].desc}`);
				break;
			default:
				ctx.reply("error");
				break;
		}
	});
