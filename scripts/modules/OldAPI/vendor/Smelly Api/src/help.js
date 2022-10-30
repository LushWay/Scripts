//import * as SA from "../../../../../../Smelly World Edit BEH/scripts/Smelly Api/index.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
import {
  COMMAND_PATHS,
  HELP_PATHS,
} from "../../../app/Contracts/Commands/Command.js";
//import { Command, HELP_PATHS } from "../../../../../../Smelly World Edit BEH/scripts/Smelly Api/modules/interfaces/Commands/CommandBuilder.js";

function prefix(command) {
  let l1 = "f",
    l2 = "r";
  if (command.tags.length > 0) {
    if (command.tags.includes("commmands")) l1 = "9§l"; //§r
    if (command.tags.includes("owner")) l1 = "6§l"; //§r
  }
  if (command.type == "test") l2 = "g";
  if (command.type == "wb") l2 = "d";
  //if (command.type == 'serv') l2 = '5'
  return "§" + l1 + "-§r§" + l2;
}

new XA.Command({
  name: "help",
  description: "Выводит список команд",
  aliases: ["?", "h"],
  type: "public",
})
  .addOption("page", "int", "Страница справки", true)
  .addOption("IncludeSubcommands", "boolean", "", true)
  .addOption("CmdsInPage", "int", "", true)
  .executes((ctx, { CmdsInPage, IncludeSubcommands }) => {
    if (ctx.data.message.split(" ")[1] == "help")
      return ctx.reply(
        "§6-help §7[§fСтраница: int§7] §7[§fВключить подкоманды: boolean§7] [§fКоманд на странице: int§7]"
      );
    let cmds;
    if (HELP_PATHS.length < 0) return ctx.reply(`§4Каманд net`);
    if (CmdsInPage && !CmdsInPage == NaN) cmds = CmdsInPage;
    if (!cmds) cmds = 20;

    let pagee = 1;

    const arg = ctx.args[0];
    if (arg) {
      if (!isNaN(arg)) {
        pagee = parseInt(arg);
      } else {
        const cmd = COMMAND_PATHS.find(
          (cmd) =>
            cmd.path.includes(arg) &&
            cmd.tags.every((tag) => ctx.sender.hasTag(tag))
        );
        if (!cmd) return ctx.reply(`§cКоманды §f${arg}§c не существует`);
        ///////////////////////
        //////////up///////////
        ///////////////////////
        const str = `§9┌──\n§7 Команда §f-${cmd.name} ${
          cmd.aliases.length > 1
            ? "§7(также " + cmd.aliases.join(", ") + ")"
            : ""
        }`;
        ctx.reply(str);
        ///////////////////////
        ////////filler/////////
        ///////////////////////
        let le = str.length;

        ///////////////////////
        /////////usage/////////
        ///////////////////////
        for (const command of COMMAND_PATHS.filter(
          (c) =>
            c.path[0] == arg && c.tags.every((tag) => ctx.sender.hasTag(tag))
        )) {
          const options = command.options.map(
            (option) =>
              `${
                option.optional
                  ? `§7[§f${option.name}: ${option.type}§7]`
                  : `§6<§f${option.name}: ${option.type}§6>`
              }`
          );
          const string = `  §f-${command.path[0]} §6${
            command.path.slice(1).length >= 1
              ? `${command.path.slice(1).join(" ")} `
              : ""
          }§f${options.length >= 1 ? options.join(" ") : ""}§7§o - ${
            command.description
          }§r`;
          ctx.reply(string);
          if (string.length > le) le = string.length;
        }
        let pro = "";
        for (let pl = -3; pl <= le; pl++) {
          pro = pro + " ";
        }
        ///////////////////////
        ////////down///////////
        ///////////////////////
        ctx.reply(`${pro}§9──┘`);
        return;
      }
    }

    const pathy = IncludeSubcommands
      ? HELP_PATHS.filter((e) =>
          e.tags.every((tag) => ctx.sender.hasTag(tag))
        ).slice(pagee * cmds - cmds, pagee * cmds)
      : HELP_PATHS.filter(
          (e) =>
            e.path[0] == e.name && e.tags.every((tag) => ctx.sender.hasTag(tag))
        ).slice(pagee * cmds - cmds, pagee * cmds);

    const pathy2 = IncludeSubcommands
      ? HELP_PATHS
      : HELP_PATHS.filter((e) => e.path[0] == e.name);

    const pathy3 = IncludeSubcommands
      ? HELP_PATHS.filter((e) => e.tags.every((tag) => ctx.sender.hasTag(tag)))
      : HELP_PATHS.filter(
          (e) =>
            e.path[0] == e.name && e.tags.every((tag) => ctx.sender.hasTag(tag))
        );

    const maxPages = Math.ceil(pathy3.length / cmds);

    let cv;
    const color = SA.Build.entity.getScore(ctx.sender, "perm");
    if (color == 2) cv = "§6";
    if (color == 1) cv = "§9";
    if (!cv) cv = "§2";
    if (pagee > maxPages) pagee = maxPages;
    ctx.reply(`§ы${cv}╒─═─═─═─═─═ §r${pagee}/${maxPages} ${cv}═─═─═─═─═─═`);
    ctx.reply(`§ы${cv}│§r          §9test, §dworlbuilder   `);

    for (const command of pathy) {
      const options = command.options.map(
        (option) =>
          `${option.optional ? "[" : "<"}${option.name}: ${option.type}${
            option.optional ? "]" : ">"
          }`
      );
      const q = prefix(command);
      let c = IncludeSubcommands
        ? `${cv}│§r ${q}${command.path.join(" ")} ${
            options.join(" ") + " "
          } §o§7- ${
            command.description ? ` ${command.description}` : " Пусто"
          }}`
        : `${cv}│§r ${q}${command.name} §o§7- ${
            command.description ? `${command.description}` : " Пусто"
          }`;
      ctx.reply("§ы" + c);
    }
    ctx.reply(
      `${cv}╘─═─═─═§f Доступно: ${pathy3.length}/${pathy2.length} ${cv}═─═─═─═`
    );
  });
