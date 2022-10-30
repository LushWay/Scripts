import { Items, ItemStack } from "@minecraft/server";
import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { COMMAND_PATHS } from "../../../../app/Contracts/Commands/Command.js";
SA.Build.chat;
const shovelCMD = new XA.Command({
  name: "shovel",
  description: "Выдает лопату",
  aliases: ["sh"],
  tags: ["commands"],
  type: "wb",
})

  .addOption("blocks", "string", "Blocks to use", true)
  .addOption("высота", "int", "Size of Shape", true)
  .addOption("радиус", "int", "Radius", true)
  .addOption("replaceBlocks", "string", "Blocks to replace", true)
  //.addOption("zone", "boolean", "Zone: false = -, true = +")
  //.addOption("offset", "int", "Offset")
  .executes(
    (ctx, { blocks, высота, replaceBlocks, радиус /*zone, offset*/ }) => {
      if (!blocks) {
        const cmd = COMMAND_PATHS.find((cmd) => cmd.path.includes("lore"));
        ctx.reply(
          `§9┌─\n§f  -${cmd.name} ${
            cmd.aliases ? "§7(также " + cmd.aliases.join(", ") + ")" : ""
          }§7§o - ${cmd.description}`
        );
        ctx.reply(`§eИспользование:§f`);
        for (const command of COMMAND_PATHS.filter(
          (c) => c.path[0] == "shovel"
        )) {
          const options = command.options.map(
            (option) =>
              `${option.optional ? "[" : "<"}${option.name}: ${option.type}${
                option.optional ? "]" : ">"
              }`
          );
          ctx.reply(`-${command.path.join(" ")} ${options.join(" ")}`);
        }
        ctx.reply(`                         §9─┘`);
        return;
      }
      if (!радиус) return ctx.invalidArg(радиус);
      const brush = new ItemStack(Items.get(`we:s`));
      if (радиус > 6) return ctx.reply("§c► Зачем тебе такой БОЛЬШОЙ?)");
      if (высота > 10) return ctx.reply("§c► Зачем тебе такой БОЛЬШОЙ?)");
      let bblocks;
      blocks == "st"
        ? (bblocks = SA.Build.entity.getTagStartsWith(ctx.sender, "st:"))
        : (bblocks = blocks);
      brush.setLore([
        "§9Adv",
        `Blocks: ${bblocks}`,
        `RBlocks: ${replaceBlocks ?? "any"}`,
        `H: ${высота} R: ${радиус ?? 1}`,
        `Z: - O: 1`,
      ]);
      ctx.give(brush);
      ctx.reply(
        `§a► §rПолучена лопата ${blocks} блоками, высотой ${высота}, радиусом ${радиус} и заполняемыми блоками ${replaceBlocks}`
      );
    }
  );

shovelCMD
  .addSubCommand({
    name: "height",
    description: "Устанавливает высоту",
    aliases: ["h"],
  })
  .addOption("height", "int", "Height of shovel")
  .executes((ctx, { height }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:shovel")
      return ctx.reply(`§cТы держишь не лопату!`);
    let lore = item.getLore();
    let c = lore[3].split(" ");
    c[1] = height;
    lore[3] = c.join(" ");
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rВысота лопаты изменена на ${height}`);
  });

shovelCMD
  .addSubCommand({
    name: "blocks",
    description: "Устанавливает блоки лопаты",
  })
  .addOption("blocks", "string", "Blocks to use")
  .executes((ctx, { blocks }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:s") return ctx.reply(`§cТы держишь не лопату!`);
    let lore = item.getLore();
    let bblocks;
    blocks == "st"
      ? (bblocks = SA.Build.entity.getTagStartsWith(ctx.sender, "st:"))
      : (bblocks = blocks);
    lore[1] = `Blocks: ${bblocks}`;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rБлок(и) лопаты изменен(ы) на ${blocks}`);
  });

shovelCMD
  .addSubCommand({
    name: "rblocks",
    description: "Устанавливает заменяемые блоки лопаты",
  })
  .addOption("blocks", "string", "Blocks to use")
  .executes((ctx, { blocks }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:s") return ctx.reply(`§cТы держишь не лопату!`);
    let lore = item.getLore();
    lore[2] = `RBlocks: ${blocks}`;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rЗаменяемый(ые) блок(и) лопаты изменен(ы) на ${blocks}`);
  });

shovelCMD
  .addSubCommand({
    name: "radius",
    description: "Устанавливает максимальное расстояние для кисти",
  })
  .addOption("radius", "int", "Radius of the cube")
  .executes((ctx, { radius }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:s") return ctx.reply(`§cТы держишь не лопату!`);
    let lore = item.getLore();
    let c = lore[3].split(" ");
    c[3] = radius;
    lore[3] = c.join(" ");
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rРадиус лопаты изменен на ${radius}`);
  });
