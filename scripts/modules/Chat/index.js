import { Player, world } from "@minecraft/server";
import { ThrowError, XA } from "xapi.js";
import { CONFIG } from "config.js";
import { po, wo } from "../../lib/Class/Options.js";

world.events.beforeChat.subscribe((data) => {
  if (data.message.startsWith(CONFIG.commandPrefix)) return;
  data.cancel = true;
  try {
    const DB = new XA.instantDB(data.sender, "chat");
    const cooldown = Number(DB.get("cooldown"));

    if (cooldown && cooldown > Date.now())
      return data.sender.tell(
        `§c► Подожди §b${Math.ceil((cooldown - Date.now()) / 1000)}сек§c!§r`
      );

    const c = Number(wo.G("chat:Cooldown") ?? CONFIG.chat.chatCooldown);
    DB.set("cooldown", c);

    const pn = XA.Entity.getScore(data.sender, "perm") ?? 0;
    let p = "";
    if (pn == 2) p = "§l§6Админ §r";
    if (pn == 1) p = "§l§9Модер §r";

    if (wo.Q("chat:ranks:disable")) p = "";
    const r = Number(wo.G("chat:range")) ?? CONFIG.chat.range;

    const nearPlayers = [
      ...data.sender.dimension.getEntities({
        maxDistance: r,
        type: "minecraft:player",
      }),
    ].filter((e) => e.id !== data.sender.id);

    const nID = nearPlayers.map((e) => e.id);

    const otherPlayers = [...world.getPlayers()].filter(
      (e) => !nID.includes(e.id)
    );

    for (const n of nearPlayers)
      if (n instanceof Player)
        n.tell(`${p}§7${data.sender.name}§r: ${data.message}`);

    for (const o of otherPlayers)
      if (o instanceof Player)
        o.tell(`${p}§8${data.sender.name}§7: ${data.message}`);

    for (const p of world.getPlayers({
      excludeTags: ["chat:sound:msgl:disable"],
    }))
      p.playSound("note.hat");

    data.sender.tell(
      !po.Q("chat:highlightMessages", data.sender)
        ? `${p}§7${data.sender.name}§r: ${data.message}`
        : `§6§lЯ§r: §f${data.message}`
    );
  } catch (error) {
    ThrowError(error);
  }
});
