import { COMMAND_PATHS } from "../../../app/Contracts/Commands/Command.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
const ll = new XA.Command(
  { name: "lore", aliases: ["l"], tags: ["commands"], type: "test" },
  (ctx) => {
    const cmd = COMMAND_PATHS.find((cmd) => cmd.path.includes("lore"));
    ctx.reply(
      `§9┌─\n§f  -${cmd.name} ${
        cmd.aliases ? "§7(также " + cmd.aliases.join(", ") + ")" : ""
      }§7§o - ${cmd.description}`
    );
    ctx.reply(`§eИспользование:§f`);
    for (const command of COMMAND_PATHS.filter((c) => c.path[0] == "lore")) {
      const options = command.options.map(
        (option) =>
          `${option.optional ? "[" : "<"}${option.name}: ${option.type}${
            option.optional ? "]" : ">"
          }`
      );
      ctx.reply(`-${command.path.join(" ")} ${options.join(" ")}`);
    }
    ctx.reply(`                         §9─┘`);
  }
);
ll.addSubCommand({ name: "run" })
  .addOption("command", "string", "")
  .executes((ctx, { command }) => {
    let item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:tool")
      return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "run";
    let commandd = "";
    let c = ctx.args.join(" ");
    if (c.endsWith('"')) {
      if (c.startsWith('"')) c = command.slice(1, 1);
      if (c.startsWith('"/')) c = command.slice(2, 1);
    } else if (c.startsWith("/")) {
      commandd = c.slice(1, 1);
    } else commandd = c;
    item.nameTag = `§r§aW► §f${commandd}`;
    lore[1] = commandd;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§aW► §f${commandd}`);
  });
ll.addSubCommand({ name: "rune" })
  .addOption("command", "string", "")
  .executes((ctx, { command }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:tool")
      return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "runE";
    let commandd = "";
    let c = ctx.args.join(" ");
    if (c.endsWith('"')) {
      if (c.startsWith('"')) c = c.slice(1, 1);
      if (c.startsWith('"/')) c = c.slice(2, 1);
    } else if (c.startsWith("/")) {
      commandd = c.slice(1, 1);
    } else commandd = c;
    item.nameTag = `§r§aW► §f${commandd}`;
    lore[1] = commandd;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§aE► §f${commandd}`);
  });
ll.addSubCommand({ name: "viewtp" }, (ctx) => {
  const item = SA.Build.entity.getHeldItem(ctx.sender);
  if (!item || item.id != "we:tool") return ctx.reply(`§cТы держишь не tool!`);
  let lore = item.getLore();
  lore[0] = "viewTP";
  item.nameTag = `§r§a► ViewTP}`;
  item.setLore(lore);
  ctx.sender
    .getComponent("minecraft:inventory")
    .container.setItem(ctx.sender.selectedSlot, item);
  ctx.reply(`§a► §rРежим инструмента изменен на телепорт по взгляду`);
});
