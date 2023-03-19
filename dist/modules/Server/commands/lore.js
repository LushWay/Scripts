import { IS, XA } from "xapi.js";
const ll = new XA.Command({
    name: "lore",
    aliases: ["l"],
    requires: (p) => IS(p.id, "moderator"),
    type: "test",
}).executes((ctx) => {
    ctx.reply("lore.help.text");
});
ll.literal({ name: "run" })
    .string("command")
    .executes((ctx, command) => {
    let item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:tool")
        return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "run";
    let commandd = "";
    let c = ctx.args.join(" ");
    if (c.endsWith('"')) {
        if (c.startsWith('"'))
            c = command.slice(1, 1);
        if (c.startsWith('"/'))
            c = command.slice(2, 1);
    }
    else if (c.startsWith("/")) {
        commandd = c.slice(1, 1);
    }
    else
        commandd = c;
    item.nameTag = `§r§aW► §f${commandd}`;
    lore[1] = commandd;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender);
});
ll.literal({ name: "rune" })
    .string("command")
    .executes((ctx, command) => {
    const item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:tool")
        return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "runE";
    let commandd = "";
    let c = ctx.args.join(" ");
    if (c.endsWith('"')) {
        if (c.startsWith('"'))
            c = c.slice(1, 1);
        if (c.startsWith('"/'))
            c = c.slice(2, 1);
    }
    else if (c.startsWith("/")) {
        commandd = c.slice(1, 1);
    }
    else
        commandd = c;
    item.nameTag = `§r§aW► §f${commandd}`;
    lore[1] = commandd;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§aE► §f${commandd}`);
});
ll.literal({ name: "viewtp" }).executes((ctx) => {
    const item = XA.Entity.getHeldItem(ctx.sender);
    if (!item || item.typeId != "we:tool")
        return ctx.reply(`§cТы держишь не tool!`);
    let lore = item.getLore();
    lore[0] = "viewTP";
    item.nameTag = `§r§a► ViewTP}`;
    item.setLore(lore);
    XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
    ctx.reply(`§a► §rРежим инструмента изменен на телепорт по взгляду`);
});
