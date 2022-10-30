import { BlockLocation, world } from "@minecraft/server";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
const genb = new XA.Command({
  name: "id",
  description: "Выдает айди",
  tags: ["commands"],
  type: "test",
}).executes((ctx) => {
  ctx.reply(
    `§a► §f${SA.Build.entity.getHeldItem(ctx.sender)?.id} ${
      SA.Build.entity.getHeldItem(ctx.sender)?.data
    } ${
      SA.Build.entity.getHeldItem(ctx.sender)?.nameTag
        ? SA.Build.entity.getHeldItem(ctx.sender)?.nameTag
        : ""
    }`
  );
});
genb.addSubCommand({ name: "c", description: "очсищ" }).executes((ctx) => {
  const tag = SA.Build.entity.getTagStartsWith(ctx.sender, "st:");
  ctx.reply(`§a► §c-§f${tag}`);
  SA.Build.entity.removeTagsStartsWith(ctx.sender, "st:");
});
genb.addSubCommand({ name: "a", description: "добав" }).executes((ctx) => {
  const blocks = [];
  SA.Build.entity
    .getTagStartsWith(ctx.sender, "st:")
    ?.split(",")
    ?.every((e) => blocks.push(e));
  blocks.push(
    `${SA.Build.entity.getHeldItem(ctx.sender)?.id}.${
      SA.Build.entity.getHeldItem(ctx.sender)?.data
    }`
  );
  ctx.reply(`§a► §f${blocks.join(", ")}`);
  SA.Build.entity.removeTagsStartsWith(ctx.sender, "st:");
  ctx.sender.addTag("st:" + blocks.join(","));
});
genb
  .addSubCommand({ name: "l", description: "Выдает id блока" })
  .addOption("location", "location", "", true)
  .executes((ctx, { location }) => {
    let l;
    location
      ? (l = new BlockLocation(location.x, location.y, location.z))
      : (l = new BlockLocation(
          Math.floor(ctx.sender.location.x),
          Math.floor(ctx.sender.location.y - 1),
          Math.floor(ctx.sender.location.z)
        ));
    ctx.reply(`§a► §f${world.getDimension("overworld").getBlock(l)?.id}`);
  });
genb
  .addSubCommand({ name: "sl", description: "Задает лор предмета" })
  .addOption("lore", "string")
  .executes((ctx) => {
    let item = SA.Build.entity.getHeldItem(ctx.sender);
    let oldtag = item.getLore();
    item.setLore(ctx.args);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
  });
genb
  .addSubCommand({ name: "st", description: "Задает лор предмета" })
  .executes((ctx) => {
    let item = SA.Build.entity.getHeldItem(ctx.sender);
    let oldtag = item.getLore();
    item.setLore([SA.Build.entity.getTagStartsWith(ctx.sender, "st:")]);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}`);
  });
genb
  .addSubCommand({ name: "sn", description: "Задает имя предмета" })
  .addOption("name", "string")
  .executes((ctx, { name }) => {
    let item = SA.Build.entity.getHeldItem(ctx.sender);
    let oldtag = item.nameTag;
    item.nameTag = name;
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.nameTag}`);
  });
genb
  .addSubCommand({ name: "sc", description: "Задает количество предметов" })
  .addOption("count", "int")
  .executes((ctx, { count }) => {
    let item = SA.Build.entity.getHeldItem(ctx.sender);
    let oldtag = item.amount;
    item.amount = count;
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.amount}`);
  });
genb
  .addSubCommand({ name: "rot", description: "Выдает ротатион" })
  .executes((ctx) => {
    ctx.reply(`§a► §f${ctx.sender.rotation.x} ${ctx.sender.rotation.y}`);
  });
