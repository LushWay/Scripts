import { S } from "../../../config/sounds.js";
import { SG } from "../../../config/sounds2.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
new XA.Command({
  name: "sound",
  aliases: ["so"],
  tags: ["commands"],
  type: "test",
})
  .addOption("sound", "string", "", true)
  .executes((ctx, { sound }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:tool")
      return ctx.reply(`§cТы держишь не tool!`);
    if (!sound) {
      return ctx.reply(SG.join("\n"));
    }
    let lore = item.getLore();
    lore[0] = "Sound";
    lore[1] = sound ?? S[0];
    lore[2] = S.includes(sound) ? S.indexOf(sound) : "0";
    item.setLore(lore);
    item.nameTag = "§r§9Sound";
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(
      `§a(s) §rПартикл инструмента изменен на ${sound ?? S[0]} (${
        S.includes(sound) ? S.indexOf(sound) : "0"
      })`
    );
  })
  .addSubCommand({ name: "n" })
  .addOption("number", "int")
  .executes((ctx, { number }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:tool")
      return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    let particle = S[number];
    lore[0] = "Sound";
    lore[1] = particle ?? S[0];
    lore[2] = String(number);
    item.nameTag = "§r§9Sound";
    console.warn(JSON.stringify(lore));
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rПартикл инструмента изменен на ${particle} (${number})`);
  });
