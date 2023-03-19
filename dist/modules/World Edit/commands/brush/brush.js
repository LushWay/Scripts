import { ItemStack, ItemTypes } from "@minecraft/server";
import { IS, XA } from "xapi.js";
import { SHAPES } from "../../modules/utils/shapes.js";
const brushCMD = new XA.Command({
    name: "brush",
    description: "Brushing commands",
    aliases: ["bru"],
    requires: (p) => IS(p.id, "moderator"),
    type: "wb",
});
brushCMD
    .string("shape", true)
    .string("blocks", true)
    .int("size", true)
    .executes((ctx, shape, blocks, size) => {
    if (!size)
        return ctx.reply(Object.keys(SHAPES).join("\n§7"));
    if (size > 6)
        return ctx.reply("§c► Зачем тебе такая БОЛЬШАЯ кисть?)");
    const brush = new ItemStack(ItemTypes.get(`we:brush`));
    if (!SHAPES[shape])
        return ctx.reply("§c" + shape);
    let bblocks;
    blocks == "st" ? (bblocks = XA.Entity.getTagStartsWith(ctx.sender, "st:")) : (bblocks = blocks);
    brush.nameTag = "§r§6" + shape;
    brush.setLore([`Shape: ${shape}`, `Blocks: ${bblocks}`, `Size: ${size}`, `Range: 300`]);
    XA.Entity.getI(ctx.sender).addItem(brush);
    ctx.reply(`§a► §rАктивирована кисть ${shape} с ${blocks} блоками и размером ${size}`);
});
brushCMD
    .literal({
    name: "size",
    description: "Устанавливает размер кисти",
})
    .int("size")
    .executes((ctx, size) => {
    const item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:brush")
        return ctx.reply(`§cТы держишь не кисть!`);
    let lore = item.getLore();
    lore[2] = `Size: ${size}`;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rРазмер кисти изменен на ${size}`);
});
brushCMD
    .literal({
    name: "mat",
    description: "Устанавливает блоки кисти",
})
    .string("blocks")
    .executes((ctx, blocks) => {
    const item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:brush")
        return ctx.reply(`§cТы держишь не кисть!`);
    let lore = item.getLore();
    let bblocks;
    blocks == "st" ? (bblocks = XA.Entity.getTagStartsWith(ctx.sender, "st:")) : (bblocks = blocks);
    lore[1] = `Blocks: ${bblocks}`;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rБлок(и) кисти изменен(ы) на ${blocks}`);
});
brushCMD
    .literal({
    name: "range",
    description: "Устанавливает максимальное расстояние для кисти",
})
    .int("range")
    .executes((ctx, range) => {
    const item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:brush")
        return ctx.reply(`§cТы держишь не кисть!`);
    let lore = item.getLore();
    lore[3] = `Range: ${range}`;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rРасстояние для кисти изменено на ${range}`);
});
