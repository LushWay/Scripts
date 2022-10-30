import { Items, ItemStack } from "@minecraft/server";
//import {SA} from "../../../../index.js"
import { SA } from "../../../../index.js";
import { XA } from "xapi.js";
import { SHAPES } from "../../modules/definitions/shapes.js";
//import { SessionBuild } from "../../vendor/builders/SessionBuilder.js";

const brushCMD = new XA.Command({
  name: "brush",
  description: "Brushing commands",
  aliases: ["bru"],
  tags: ["commands"],
  type: "wb",
})
  .addOption("shape", "string", "Shape of the sphere", true)
  .addOption("blocks", "string", "Blocks to use", true)
  .addOption("size", "int", "Size of Shape", true)
  .executes((ctx, { shape, blocks, size }) => {
    if (!size) return ctx.reply(Object.keys(SHAPES).join("\n§7"));
    if (size > 6) return ctx.reply("§c► Зачем тебе такая БОЛЬШАЯ кисть?)");
    const brush = new ItemStack(Items.get(`we:brush`));
    if (!SHAPES[shape]) return ctx.invalidArg(shape);
    let bblocks;
    blocks == "st"
      ? (bblocks = SA.Build.entity.getTagStartsWith(ctx.sender, "st:"))
      : (bblocks = blocks);
    brush.nameTag = "§r§6" + shape;
    brush.setLore([
      `Shape: ${shape}`,
      `Blocks: ${bblocks}`,
      `Size: ${size}`,
      `Range: 300`,
    ]);
    ctx.give(brush);
    ctx.reply(
      `§a► §rАктивирована кисть ${shape} с ${blocks} блоками и размером ${size}`
    );
  });

brushCMD
  .addSubCommand({
    name: "size",
    description: "Устанавливает размер кисти",
  })
  .addOption("size", "int", "Size of Sphere")
  .executes((ctx, { size }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:brush")
      return ctx.reply(`§cТы держишь не кисть!`);
    let lore = item.getLore();
    lore[2] = `Size: ${size}`;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rРазмер кисти изменен на ${size}`);
  });

brushCMD
  .addSubCommand({
    name: "mat",
    description: "Устанавливает блоки кисти",
  })
  .addOption("blocks", "string", "Blocks to use")
  .executes((ctx, { blocks }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:brush")
      return ctx.reply(`§cТы держишь не кисть!`);
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
    ctx.reply(`§a► §rБлок(и) кисти изменен(ы) на ${blocks}`);
  });

brushCMD
  .addSubCommand({
    name: "range",
    description: "Устанавливает максимальное расстояние для кисти",
  })
  .addOption("range", "int", "Range the brush can reach")
  .executes((ctx, { range }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:brush")
      return ctx.reply(`§cТы держишь не кисть!`);
    let lore = item.getLore();
    lore[3] = `Range: ${range}`;
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rРасстояние для кисти изменено на ${range}`);
  });
