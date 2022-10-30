import { Log, toStr, XA } from "xapi.js";
import { CClass } from "../../lib/Command/Command.js";
import { __COMMANDS__ } from "../../lib/Command/index.js";
import { commandNotFound, noPerm, getUsage } from "../../lib/Command/utils.js";

const help = new XA.Command({
  name: "help",
  description: "Выводит список команд",
  aliases: ["?", "h"],
});

help
  .int("page", true)
  .int("commandsInPage", true)
  .executes((ctx, p, s) => {
    const aval = __COMMANDS__.filter((e) => e.data.requires(ctx.sender)),
      cmds = s || 15,
      maxPages = Math.ceil(aval.length / cmds),
      page = Math.min(p || 1, maxPages),
      path = aval.slice(page * cmds - cmds, page * cmds),
      color = XA.Entity.getScore(ctx.sender, "perm");

    let cv = "§2";
    if (color == 2) cv = "§6";
    if (color == 1) cv = "§9"; //§r

    ctx.reply(`§ы${cv}─═─═─═─═─═ §r${page}/${maxPages} ${cv}═─═─═─═─═─═─`);

    for (const command of path) {
      const q = "§f-";
      let c = `${cv}§r ${q}${command.data.name} §o§7- ${
        command.data.description ? `${command.data.description}` : " Пусто" //§r
      }`;
      ctx.reply("§ы" + c);
    }
    ctx.reply(
      `${cv}─═─═─═§f Доступно: ${aval.length}/${__COMMANDS__.length} ${cv}═─═─═─═─`
    );
  });

help.string("commandName").executes((ctx, commandName) => {
  /**
   * @type {CClass}
   */
  const cmd = __COMMANDS__.find(
    (e) => e.data.name == commandName || e.data.aliases.includes(commandName)
  );

  if (!cmd) return commandNotFound(ctx.sender, commandName);
  if (!cmd.data?.requires(ctx.data.sender))
    return noPerm(ctx.data.sender, cmd), "fail";

  const d = cmd.data;

  // ctx.reply(`§9┌──`)
  const str = `§fКоманда §6-${d.name} ${
    d.aliases?.length > 0
      ? "§7(также §f" + d.aliases.join("§7, §f") + "§7)"
      : ""
  }`;
  ctx.reply(str);
  ctx.reply(" ");

  let l = str.length;

  for (const command of cmd.children) {
    const path = getUsage(command);
    const _ = `§7>  §f-${path.join(" ")}§7§o - ${command.data.description}§r`;
    l = Math.max(l, _.length);
    ctx.reply(_);
  }
  // ctx.reply(`${new Array(l -2).join(" ")}§9──┘`);
  return;
});
