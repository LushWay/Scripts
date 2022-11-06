import {
  world,
  Location,
  BlockLocation,
  InventoryComponentContainer,
  Player,
  MinecraftEffectTypes,
  MinecraftBlockTypes,
  ItemStack,
  MinecraftItemTypes,
  BlockRaycastOptions,
  Vector,
  BlockType,
} from "@minecraft/server";
import { po, wo, WorldOption } from "../../app/Models/Options.js";
import { parseLocationAugs } from "../../app/Utilities/formatter.js";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { rd } from "../Airdrops/index.js";
import { quene } from "../Battle Royal/index.js";
import { stats } from "../Private/private.js";
import { globalRadius } from "../Server/index.js";

new WorldOption(
  "spawn:pos",
  "(x y z)\nТакже можно выставить через -spawn set <pos: Pos>",
  true
);
new WorldOption(
  "minigames:pos",
  "(x y z)\nТакже можно выставить через -mg set <pos: Pos>",
  true
);
class inventory {
  constructor() {
    this.gamerules = [
      "sendcommandfeedback:false",
      "keepinventory:false",
      "doimmediaterespawn:true",
      "showdeathmessages:false",
    ];
    this.save = [];
    this.structureName = "i:$name";
    this.savezones = [
      new BlockLocation(20, -62, 20),
      new BlockLocation(24, -62, 20),
      new BlockLocation(26, -62, 20),
      new BlockLocation(28, -62, 20),
    ];
    this.fillblocks = {
      air: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      bedrock: [
        { x: 0, y: -1, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z: 1 },
        { x: -1, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: -1 },
        { x: 0, y: 1, z: 1 },
        { x: 0, y: 2, z: 0 },
      ],
    };
  }
  #gamerules(IsSet) {
    if (IsSet) {
      this.save = [];
      for (const g of this.gamerules) {
        this.save.push(
          SA.Build.chat.runCommand(`gamerule ${g.split(":")[0]}`)?.statusMessage
        );
        SA.Build.chat.runCommand(
          `gamerule ${g.split(":")[0]} ${g.split(":")[1]}`
        );
      }
    } else
      this.save.forEach((g) =>
        SA.Build.chat.runCommand(
          `gamerule ${g.split(" = ")[0]} ${g.split(" = ")[1]}`
        )
      );
  }
  #setZone(bl) {
    this.fillblocks.bedrock.forEach((e) => {
      world
        .getDimension("overworld")
        .getBlock(new BlockLocation(bl.x + e.x, bl.y + e.y, bl.z + e.z))
        .setType(MinecraftBlockTypes.bedrock);
    });
    this.fillblocks.air.forEach((e) => {
      world
        .getDimension("overworld")
        .getBlock(new BlockLocation(bl.x + e.x, bl.y + e.y, bl.z + e.z))
        .setType(MinecraftBlockTypes.air);
    });
  }
  /**
   *
   * @param {Number} i
   * @param {Player} pl
   * @returns
   */
  async saveInv(i, pl) {
    const inv = XA.Entity.getI(pl);
    if (i != invs.anarch || inv.size == inv.emptySlotsCount) return;
    //console.warn("Сохранение инвентаря, старт");
    this.#gamerules(true);
    const zone = this.savezones.find(
      (e) =>
        world.getDimension("overworld").getEntitiesAtBlockLocation(e).length < 1
    );
    if (!zone) return world.say("§cError");
    this.#setZone(zone);
    pl.teleport(
      new Location(zone.x, zone.y, zone.z),
      world.getDimension("overworld"),
      0,
      0,
      false
    );
    await SA.Utilities.time.sleep(5);
    pl.addTag("saving");
    const name = pl.name;
    pl.kill();
    SA.Utilities.time.sleep(10).then((e) => {
      SA.Build.chat.runCommand(
        `structure save ${this.structureName.replace("$name", pl.name)} ${
          zone.x
        } ${zone.y} ${zone.z} ${zone.x} ${zone.y + 1} ${
          zone.z
        } true disk false`,
        "overworld"
      );
      const a = XA.Entity.getAtPos({
        x: zone.x,
        y: zone.y,
        z: zone.z,
      }).length;
      SA.Build.chat.runCommand(
        `kill @e[type=item,x=${zone.x},y=${zone.y},z=${zone.z},r=2]`,
        "overworld"
      );
      pl.tell(`Сохранено ${a} предметов`);
    });
    //console.warn("Сохранение инвентаря, прода");
    let C = 0;
    while (SA.Build.chat.runCommand("testfor " + name)?.error && C < 100) {
      C++;
      await SA.Utilities.time.sleep(5);
    }

    //console.warn("Инвентарь сохранен");
    const player = XA.Entity.fetch(name);
    player.removeTag("saving");
    this.#gamerules(false);
  }
  /**
   *
   * @param {Number} i
   * @param {Player} pl
   * @returns
   */
  async loadInv(i, pl) {
    if (i != invs.anarch) {
      //console.warn("Загрузка стандартного инвентаря");
      SA.Build.chat.runCommand(`clear ${pl.name}`);
      SA.Build.chat.runCommand(
        `replaceitem entity ${pl.name} slot.hotbar 4 mcbehub:gui 1 0 {"item_lock":{"mode":"lock_in_slot"}}`
      );
    } else {
      //console.warn("Загрузка инвентаря анархии, старт");

      const zone = this.savezones.find(
        (e) =>
          world.getDimension("overworld").getEntitiesAtBlockLocation(e).length <
          1
      );
      if (!zone) return world.say("§cError");
      this.#setZone(zone);
      pl.teleport(
        new Location(zone.x, zone.y, zone.z),
        world.getDimension("overworld"),
        0,
        0,
        false
      );
      SA.Build.chat.runCommand(`clear ${pl.name}`);
      SA.Build.chat.runCommand(
        `structure load ${this.structureName.replace("$name", pl.name)} ${
          zone.x
        } ${zone.y} ${zone.z} 0_degrees none true false`,
        "overworld"
      );
      SA.Build.chat.runCommand(
        `structure delete ${this.structureName.replace("$name", pl.name)}`,
        "overworld"
      );
      await SA.Utilities.time.sleep(1);
      while (
        world
          .getDimension("overworld")
          .getEntitiesAtBlockLocation(zone)
          .filter((e) => e.typeId == "minecraft:item").length > 0
      ) {
        pl.runCommand("title @s title §cОдень броню!");
        await SA.Utilities.time.sleep(3);
      }
      return;
      //console.warn('Загрузка завершена');
    }
  }
}
const inv = new inventory();

const invs = { spawn: 1, anarch: 2, minigames: 1, currentplace: 1, br: 1 };
const objectives = ["inv"];

world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
  if (
    data.id != "binocraft:on_death" ||
    XA.Entity.getScore(data.entity, objectives[0]) != invs.anarch ||
    data.entity.hasTag("saving")
  )
    return;
  stats.deaths.Eadd(data.entity, 1);
  if (data.entity.hasTag("br:alive")) return;
  data.cancel = true;
  const ent = data.entity.dimension.spawnEntity(
    "t:hpper_minecart",
    new Location(
      data.entity.location.x,
      data.entity.location.y + 0.2,
      data.entity.location.z
    )
  );
  try {
    data.entity.runCommand(
      "tp @e[type=item,r=4] @e[type=t:hpper_minecart,c=1]"
    );
  } catch (e) {
    XA.Entity.despawn(ent);
    return;
  }
  data.entity.dimension.spawnEntity(
    "f:t",
    ent.location
  ).nameTag = `§6-=[§f${data.entity.nameTag}§6]=-`;
});
world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
  if (data.id != "ded") return;
  const c = XA.Entity.getClosetsEntitys(data.entity, 1, "f:t", 1, false)[0];
  c.nameTag = `§6-=[§f    §6]=-`;
  SA.Utilities.time.setTickTimeout(() => {
    c.nameTag = `§6-=[  ]=-`;
  }, 5);
  SA.Utilities.time.setTickTimeout(() => {
    c.nameTag = `§6-=[ ]=-`;
  }, 10);
  SA.Utilities.time.setTickTimeout(() => {
    c.nameTag = `§6-[]-`;
  }, 15);
  SA.Utilities.time.setTickTimeout(() => {
    c.nameTag = `§6-`;
  }, 20);
  SA.Utilities.time.setTickTimeout(() => {
    c.teleport(new Location(0, -64, 0), c.dimension, 0, 0);
    c.triggerEvent("kill");
  }, 25);
});
SA.Utilities.time.setTickInterval(() => {
  for (const e of SA.Build.world.getEntitys("t:hpper_minecart")) {
    const inv = XA.Entity.getI(e);
    if (inv.size == inv.emptySlotsCount) {
      e.triggerEvent("ded");
      e.kill();
    }
  }
}, 20);

/**
 *
 * @param {Player} player
 * @param {String} place spawn | anarch | minigames
 * @returns void
 * @example tp(player, 'spawn')
 */
export function Atp(
  player,
  place,
  ignorepvp,
  ignorebr,
  ignorequene,
  setDefaultInventory
) {
  //log(`Atp ${place} ${ignorepvp}`)
  if (!ignorebr && XA.Entity.getTagStartsWith(player, "locktp:"))
    return player.runCommand(
      `tellraw @s {"rawtext":[{"translate":"§c► Сейчас это запрещено (префикс запрета: ${XA.Entity.getTagStartsWith(
        player,
        "locktp:"
      )})"}]}`
    );
  if (!ignorequene && Object.keys(quene).includes(player.name))
    return player.runCommand(
      `tellraw @s {"rawtext":[{"translate":"§c► Вы не можете телепортироваться, стоя в очереди. Выйти: §f-br quit"}]}`
    );
  if (!ignorepvp && XA.Entity.getScore(player, "pvp") > 0)
    return player.runCommand(
      `tellraw @s {"rawtext":[{"translate":"§c► В режиме пвп это запрещено"}]}`
    );
  const currentInv = XA.Entity.getScore(player, objectives[0]);
  const ps = invs[place];
  if (!ps) return console.warn("Неправильное место: " + place);
  if (place != "anarch" && place != "currentpos" && !wo.Q(`${place}:pos`))
    return player.runCommand(
      `tellraw @s {"rawtext":[{"text":"§cТупые админы забыли поставить корды ${place}"}]}`
    );
  let pos,
    rtp = false,
    air = false;
  if (place == "anarch") {
    SA.tables.pos.has(player.name)
      ? (pos = SA.tables.pos.get(player.name))
      : (rtp = true);
    if (currentInv == invs.anarch && !rtp) return;
  } else if (place == "currentpos") {
    const l = XA.Entity.locationToBlockLocation(player.location);
    pos = l.x + " " + l.y + " " + l.z;
  } else {
    pos = wo.Q(`${place}:pos`);
  }
  if (rtp) {
    const center = wo.Q("zone:center")
      ? wo.G("zone:center").split(", ")
      : [0, 0];
    let y,
      x,
      z,
      C = 0;
    while (!y && C < 30) {
      C++;
      x = rd(
        Number(center[0]) + globalRadius - 10,
        Number(center[0]) - globalRadius + 10
      );
      z = rd(
        Number(center[1]) + globalRadius - 10,
        Number(center[1]) - globalRadius + 10
      );
      const q = new BlockRaycastOptions();
      (q.includeLiquidBlocks = false), (q.includePassableBlocks = false);
      const b = world
        .getDimension("overworld")
        .getBlockFromRay(new Location(x, 320, z), new Vector(0, -1, 0));
      if (b && b.location.y >= 63) {
        y = b.location.y + 1;
        break;
      }
    }
    if (!y) {
      air = true;
      y = 200;
    }
    pos = x + " " + y + " " + z;
  }

  if (ps == invs.anarch) {
    player.tell(
      `§r§${air ? "5Воздух" : "9Земля"}§r ${
        po.Q("anarchy:hideCoordinates", player) ? "" : pos
      }`
    );
  }

  if (currentInv == invs.anarch) {
    const l = XA.Entity.locationToBlockLocation(player.location);
    SA.tables.pos.set(player.name, l.x + " " + l.y + " " + l.z);
  }
  const inve = XA.Entity.getI(player);
  let obj = { on: false };
  if (Object.keys(invs).find((e) => invs[e] == currentInv))
    obj = {
      on: true,
      place: Object.keys(invs).find((e) => invs[e] == currentInv),
    };
  if (
    (currentInv == ps ||
      (inve.size == inve.emptySlotsCount && place != "anarch")) &&
    !(
      (!setDefaultInventory && inve.size == inve.emptySlotsCount) ||
      setDefaultInventory
    )
  ) {
    XA.Entity.tp(
      player,
      pos,
      place,
      po.Q("title:spawn:enable", player),
      null,
      null,
      air
    );
    player.runCommand(`scoreboard players set @s ${objectives[0]} ${ps}`);
  } else {
    try {
      if (!setDefaultInventory) player.runCommand("testfor @s[m=!c]");
      inv.saveInv(currentInv, player).then(() =>
        inv.loadInv(ps, player).then(() => {
          player.runCommand(`scoreboard players set @s ${objectives[0]} ${ps}`);
          XA.Entity.tp(
            player,
            pos,
            place,
            po.Q("title:spawn:enable", player),
            obj,
            null,
            air,
            (!setDefaultInventory && inve.size == inve.emptySlotsCount) ||
              place == "currentpos"
          );
        })
      );
    } catch (e) {
      player.runCommand(`scoreboard players set @s ${objectives[0]} ${ps}`);
      XA.Entity.tp(
        player,
        pos,
        place,
        po.Q("title:spawn:enable", player),
        obj,
        null,
        air
      );
    }
  }
}

const qqq = {};
const scores = {};
scores.objective = objectives[0];
scores.minScore = 1;
scores.maxScore = 1;
qqq.scoreOptions = [scores];
SA.Utilities.time.setTickInterval(
  () => {
    for (const p of world.getPlayers())
      try {
        p.runCommand(
          "execute as @s if block ~~-2~ bedrock if block ~~-3~ chest run event entity @s portal"
        );
      } catch (ee) {}
    const pos = wo
      .G("spawn:pos")
      ?.split(" ")
      ?.map((e) => Number(e));
    const pos2 = wo
      .G("minigames:pos")
      ?.split(" ")
      ?.map((e) => Number(e));
    for (const pl of world.getPlayers(qqq)) {
      if (
        pos &&
        XA.Entity.getScore(pl, "inv") == 1 &&
        !XA.Entity.hasItem(pl, "armor.chest", "elytra") &&
        pl.location.y < pos[1] - 10
      ) {
        try {
          pl.runCommand(
            `execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${
              pl.name
            }",r=50]`
          );
          Atp(pl, "spawn", true);
        } catch (e) {}
      } else {
        try {
          pl.runCommand(
            `execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${
              pl.name
            }",r=200]`
          );
          if (pl.location.y < pos[1] - 50) Atp(pl, "spawn", true);
        } catch (e) {}
        try {
          pl.runCommand(
            `execute positioned ${wo.Q("spawn:pos")} run testfor @a[name="${
              pl.name
            }",rm=200,r=210]`
          );
          Atp(pl, "spawn", true);
        } catch (e) {}
      }
      if (pos2 && pl.location.y < pos2[1] - 10) {
        try {
          pl.runCommand(
            `execute positioned ${wo.Q("minigames:pos")} run testfor @a[name="${
              pl.name
            }",r=50]`
          );
          Atp(pl, "minigames", true);
        } catch (e) {}
      }
    }
    for (const obj of objectives)
      SA.Build.chat.runCommand(`scoreboard objectives add ${obj} dummy`);
  },
  0,
  "portals"
);

world.events.beforeDataDrivenEntityTriggerEvent.subscribe((data) => {
  if (data.id != "portal" || !(data.entity instanceof Player)) return;
  data.cancel = true;
  const to = world
    .getDimension(data.entity.dimension.id)
    .getBlock(
      new BlockLocation(
        Math.floor(data.entity.location.x),
        Math.floor(data.entity.location.y - 3),
        Math.floor(data.entity.location.z)
      )
    );
  if (to.typeId != "minecraft:chest") return;
  /**
   * @type {InventoryComponentContainer}
   */
  const toi = to.getComponent("inventory").container;
  const i = toi.getItem(0);
  if (!i) return;
  switch (i.getLore()[0]) {
    case "forward":
      let poo;
      if (i.getLore()[1] == "minigames") poo = wo.G("minigames:pos");
      if (!poo) poo = i.getLore()[1];

      XA.Entity.tp(
        data.entity,
        poo,
        i.getLore()[2],
        po.Q("title:spawn:enable", data.entity),
        { on: false },
        i.getLore()[3]
      );
      break;
    case "trigger":
      SA.Exceptions.E.triggerEvent(i.getLore()[1], {
        player: data.entity,
        item: i,
      });
      break;
    default:
      Atp(data.entity, i.getLore()[0]);
      break;
  }
});

new XA.Command({
  name: "hub",
  aliases: ["spawn", "tp"],
  description: "§bПеремещает на спавн",
  /*type: "public"*/
})
  .executes((ctx) => {
    Atp(ctx.sender, "spawn");
  })
  .literal({ name: "set", requires: (p) => p.hasTag("commands") })
  .location("pos", true)
  .executes((ctx, pos) => {
    let loc = XA.Entity.locationToBlockLocation(pos ?? ctx.sender.location);
    const rl = loc.x + " " + loc.y + " " + loc.z;
    ctx.reply(rl);
    wo.set("spawn:pos", rl);
    ctx.sender.runCommandAsync("setworldspawn " + rl);
  });

new XA.Command({
  name: "minigames",
  aliases: ["mg"],
  description: "§bПеремещает на спавн минигр",
  /*type: "public"*/
})
  .executes((ctx) => {
    Atp(ctx.sender, "minigames");
  })
  .literal({ name: "set", requires: (p) => p.hasTag("commands") })
  .location("pos", true)
  .executes((ctx, pos) => {
    let loc = XA.Entity.locationToBlockLocation(pos ?? ctx.sender.location);
    const rl = loc.x + " " + loc.y + " " + loc.z;
    ctx.reply(rl);
    wo.set("minigames:pos", rl);
  });

new XA.Command({
  name: "anarchy",
  aliases: ["anarch"],
  description: "§bПеремещает на анархию",
  /*type: "public"*/
})
  .executes((ctx) => {
    Atp(ctx.sender, "anarch");
  })
  .literal({ name: "set", requires: (p) => p.hasTag("commands") })
  .location("pos", true)
  .executes((ctx, pos) => {
    let loc = XA.Entity.locationToBlockLocation(pos ?? ctx.sender.location);
    const rl = loc.x + " " + loc.y + " " + loc.z;
    ctx.reply(rl);
    wo.set("anarch:pos", rl);
  });

new XA.Command({
  name: "portal",
  aliases: ["port"],
  description: "Ставит портал",
  requires: (p) => p.hasTag("owner"),
})
  .boolean("addOrSet")
  .string("lore")
  .executes((ctx, q) => {
    let item = new ItemStack(MinecraftItemTypes.grayCandle, 1, 0);
    item.setLore(ctx.args.slice(1));
    const block = ctx.sender.dimension.getBlock(
      XA.Entity.locationToBlockLocation(ctx.sender.location).offset(
        0,
        q ? -3 : -4,
        0
      )
    );
    block.setType(MinecraftBlockTypes.chest);
    block.getComponent("inventory").container.setItem(0, item);
    const loc = XA.Entity.locationToBlockLocation(ctx.sender.location).offset(
      0,
      1,
      0
    );
    const l = new Location(loc.x + 0.5, loc.y, loc.z + 0.5);
    if (q)
      ctx.sender.teleport(
        l,
        ctx.sender.dimension,
        ctx.sender.rotation.x,
        ctx.sender.rotation.y,
        false
      );
    ctx.reply(`§f► ${ctx.args.slice(1).join("§r, ")}`);
    ctx.sender.runCommand("setblock ~~-3~ bedrock");
  });
