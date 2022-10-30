import { wo, WORLDOPTIONS } from "../../../app/Models/Options.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
const opt = new XA.Command(
  { name: "world", description: "Настройки мира", tags: ["owner"] },
  (ctx) => {
    ctx.reply("§7► §fAvaible options §7◄");
    for (let opt of WORLDOPTIONS) {
      ctx.reply(
        ` §7[${wo.Q(opt.name) ? "§a+" : "§c-"}§7] §f${opt.name} §o§7- ${
          opt.desc
        }`
      );
    }
    ctx.reply("§7► §f---------- §7◄");
  }
);
opt.addSubCommand({ name: "act" }, (ctx) => {
  ctx.reply("§2► §fActive options §2◄");
  for (let opt of WORLDOPTIONS) {
    if (wo.Q(opt.name)) ctx.reply(` §a-§f${opt.name} §o§7- ${opt.desc}`);
  }
  ctx.reply("§2► §f----------- §2◄");
});
opt
  .addSubCommand({ name: "ch" })
  .addOption("optionName", "string")
  .executes((ctx, { optionName }) => {
    const ret = wo.change(optionName);
    switch (ret[0]) {
      case "no":
        ctx.invalidArg(optionName);
      case "removed":
        ctx.reply(` §7[§c-§7] §f${ret[1].name} §o§7- ${ret[1].desc}`);
        break;
      case "added":
        ctx.reply(` §7[§a+§7] §f${ret[1].name} §o§7- ${ret[1].desc}`);
        break;
      default:
        ctx.reply("error");
        break;
    }
  });
