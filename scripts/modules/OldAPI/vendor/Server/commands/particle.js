import { P } from "../../../config/particles.js";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
new XA.Command({
  name: "particle",
  aliases: ["p"],
  tags: ["commands"],
  type: "test",
})
  .addOption("particle", "string", "", true)
  .executes((ctx, { particle }) => {
    const item = SA.Build.entity.getHeldItem(ctx.sender);
    if (!item || item.id != "we:tool")
      return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "Particle";
    lore[1] = particle ?? P[0];
    lore[2] = "0";
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(
      `§a(s) §rПартикл инструмента изменен на ${particle ?? P[0]} (${
        P.includes(particle) ? P.indexOf(particle) : "0"
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
    let particle = P[number];
    lore[0] = "Particle";
    lore[1] = particle ?? P[0];
    lore[2] = String(number);
    console.warn(JSON.stringify(lore));
    item.setLore(lore);
    ctx.sender
      .getComponent("minecraft:inventory")
      .container.setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a(s) §rПартикл инструмента изменен на ${particle} (${number})`);
  });
