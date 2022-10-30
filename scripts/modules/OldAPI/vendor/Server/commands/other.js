import {
  BlockInventoryComponentContainer,
  BlockLocation,
  Items,
  ItemStack,
  Location,
} from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import { SA } from "../../../index.js";
import { XA } from "xapi.js";
import { globalRadius } from "../index.js";
new XA.Command({
  name: "form",
  description: "",
  tags: ["commands"],
  type: "test",
})
  .addOption("type", "int")
  .executes((ctx, { type }) => {
    SA.Utilities.time.setTickTimeout(() => {
      if (type == 0) {
        new ModalFormData()
          .title("modal")
          .dropdown("dropdown", ["", ""])
          .show(ctx.sender)
          .then((ModalFormResponse) => console.warn(ModalFormResponse));
      }
      if (type == 1) {
        new ActionFormData()
          .title("action")
          .button("ok")
          .show(ctx.sender)
          .then((ActionFormResponse) => console.warn(ActionFormResponse));
      }
      if (type == 2) {
        new MessageFormData()
          .title("modal")
          .button1("btn1")
          .show(ctx.sender)
          .then((MessageFormResponse) => console.warn(MessageFormResponse));
      }
    }, 40);
  });
new XA.Command(
  { name: "info", description: "Открывает гайд", type: "public" },
  (ctx) => {
    ctx.sender.removeTag("WSeenLearning");
  }
);
const daily_reward_hours = 24;
const kit = new XA.Command({
  name: "kit",
  description: "Выдает кит",
  type: "public",
});
kit.addOption("name", "string", "", true).executes((ctx, { name }) => {
  const ALLkits = SA.tables.kits.keys();
  if (ALLkits.length < 1) return ctx.reply("§сНет китов");
  const kits = ALLkits.filter(
    (e) => e.split(":")[0] == "any" || ctx.sender.hasTag(e.split(":")[0])
  );
  if (kits.length < 1) return ctx.reply("§сНет доступных китов");
  let kkits = [],
    avaible = {},
    unavaible = [];
  for (const kit of kits) {
    const cooldown =
      ctx.sender
        .getTags()
        .find((tag) => tag.startsWith(kit.split(":")[1]))
        ?.substring(kit.split(":")[1].length + 1) ?? null;
    if (cooldown > Date.now()) {
      const hrs = Math.ceil((cooldown - Date.now()) / 3.6e6) + "";
      let o;
      if (hrs.endsWith("1") && hrs != "11") {
        o = "час §cостался!";
      } else if (hrs.endsWith("2") || hrs.endsWith("3") || hrs.endsWith("4")) {
        o = `часa §cосталось`;
      } else {
        o = `часов §cосталось`;
      }
      unavaible.push(kit.split(":")[1] + ":" + hrs + " " + o);
      kkits.push(`§7${kit.split(":")[1]} §с(§b${hrs} ${o})`);
    } else {
      avaible[kit.split(":")[1]] = {
        tag: kit.split(":")[0],
        cd: kit.split(":")[2],
      };
      kkits.push(`§7${kit.split(":")[1]} §6(Доступно)`);
    }
  }
  if (!name) return ctx.reply("§fДоступные киты: \n  §7" + kkits.join("\n  "));
  if (!avaible[name]) {
    if (unavaible.find((e) => e.split(":")[0] == name))
      return ctx.reply(
        `§cКит §6${name}§c был взят недавно. §b${
          unavaible.find((e) => e.split(":")[0] == name).split(":")[1]
        }`
      );
    return ctx.reply(`§cКита с названием §6${name}§c не существует`);
  }
  SA.Build.entity.removeTagsStartsWith(ctx.sender, `${name}:`);
  ctx.sender.addTag(`${name}:${Date.now() + avaible[name].cd * 3.6e6}`);
  const kit = SA.tables.kits.get(
    avaible[name].tag + ":" + name + ":" + avaible[name].cd
  );
  kit.forEach((e) => ctx.run(`give @s ${e}`));
  ctx.reply(`§7Получен кит §6${name}§7!`);
});
kit
  .addSubCommand({ name: "all", description: "Выдает все киты" })
  .executes((ctx) => {
    const ALLkits = SA.tables.kits.keys();
    if (ALLkits.length < 1) return ctx.reply("§сНет китов");
    const kits = ALLkits.filter((e) => e.split(":")[0] == "any");
    if (kits.length < 1) return ctx.reply("§сНет доступных китов");
    let kkits = [],
      avaible = {},
      unavaible = [];
    for (const kit of kits) {
      const cooldown =
        ctx.sender
          .getTags()
          .find((tag) => tag.startsWith(kit.split(":")[1]))
          ?.substring(kit.split(":")[1].length + 1) ?? null;
      if (cooldown > Date.now()) {
        const hrs = Math.ceil((cooldown - Date.now()) / 3.6e6) + "";
        let o;
        if (hrs.endsWith("1")) {
          o = "час §cостался!";
        } else if (
          hrs.endsWith("2") ||
          hrs.endsWith("3") ||
          hrs.endsWith("4")
        ) {
          o = `часa §cосталось`;
        } else {
          o = `часов §cосталось`;
        }
        unavaible.push(kit.split(":")[1] + ":" + hrs + " " + o);
        kkits.push(`§7${kit.split(":")[1]} §с(§b${hrs} ${o})`);
      } else {
        avaible[kit.split(":")[1]] = kit.split(":")[0];
        kkits.push(`§7${kit.split(":")[1]} §6(Доступно)`);
        SA.Build.entity.removeTagsStartsWith(
          ctx.sender,
          `${kit.split(":")[1]}:`
        );
        ctx.sender.addTag(
          `${kit.split(":")[1]}:${Date.now() + kit.split(":")[2] * 3.6e6}`
        );
        const kiit = SA.tables.kits.get(kit);
        kiit.forEach((e) => ctx.run(`give @s ${e}`));
      }
    }
    ctx.reply(`§7Получены киты: §6${Object.keys(avaible).join(", ")}§7!`);
  });
kit
  .addSubCommand({ name: "add", description: "Добавляет", tags: ["commands"] })
  .addOption("tag", "string", "")
  .addOption("name", "string", "")
  .addOption("cdhours", "int", "", true)
  .executes((ctx, { name, tag, cdhours }) => {
    const wb = ctx.sender.dimension.getBlock(
      new BlockLocation(
        Math.floor(ctx.sender.location.x),
        Math.floor(ctx.sender.location.y),
        Math.floor(ctx.sender.location.z)
      )
    );
    const b = wb.getComponent("inventory")?.container;
    if (!b)
      return ctx.reply("§cВстань на сундук с китом! (блок: " + wb.id + ")");
    let inv = [];
    for (let i = 0; i < b.size; i++) {
      /** * @type {ItemStack} */ const item = b.getItem(i);
      if (item) inv.push(item.id + " " + item.amount + " " + item.data);
    }
    ctx.reply(`§fДобавлен кит с такими предметами:\n  §7` + inv.join("\n  "));
    let cd = daily_reward_hours;
    if (cdhours || cdhours == 0) cd = cdhours;
    SA.tables.kits.set(tag + ":" + name + ":" + cd, inv);
  });
kit
  .addSubCommand({ name: "set", description: "Добавляет", tags: ["commands"] })
  .addOption("name", "string", "")
  .executes((ctx, { name }) => {
    const n = SA.tables.kits.keys().find((e) => e.split(":")[1].endsWith(name));
    if (!n)
      return ctx.reply(
        `§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
          SA.tables.kits.keys().join("\n  ")
      );
    const wb = ctx.sender.dimension.getBlock(
      new BlockLocation(
        Math.floor(ctx.sender.location.x),
        Math.floor(ctx.sender.location.y),
        Math.floor(ctx.sender.location.z)
      )
    );
    const b = wb.getComponent("inventory")?.container;
    if (!b)
      return ctx.reply("§cВстань на сундук с китом! (блок: " + wb.id + ")");
    let inv = [];
    for (let i = 0; i < b.size; i++) {
      /** * @type {ItemStack} */ const item = b.getItem(i);
      if (item) inv.push(item.id + " " + item.amount + " " + item.data);
    }
    ctx.reply(`§fДобавлен кит с такими предметами:\n  §7` + inv.join("\n  "));
    SA.tables.kits.set(n, inv);
  });
kit
  .addSubCommand({ name: "del", description: "ДЦт", tags: ["commands"] })
  .addOption("name", "string", "")
  .executes((ctx, { name }) => {
    const n = SA.tables.kits.keys().find((e) => e.split(":")[1].endsWith(name));
    if (!n)
      return ctx.reply(
        `§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
          SA.tables.kits.keys().join("\n  ")
      );
    ctx.reply(`§7Удален кит с такими названием: §6${n}§r`);
    SA.tables.kits.delete(n);
  });
kit
  .addSubCommand({ name: "red", description: "Редактирует кит" })
  .addOption("name", "string", "")
  .executes((ctx, { name }) => {
    const kits = SA.tables.kits.keys();
    if (kits.length < 1) return ctx.reply("§сНет китов");
    const n = kits.find((e) => e.split(":")[1].endsWith(name));
    if (!n)
      return ctx.reply(
        `§cКита с названием '§f${name}§c' не существует. \n§fДоступные киты: \n  §7` +
          SA.tables.kits.keys().join("\n  ")
      );
    const kit = SA.tables.kits.get(n);
    ctx.sender.runCommand("setblock ~~~ chest");
    /** * @type {BlockInventoryComponentContainer} */ const inv =
      ctx.sender.dimension
        .getBlock(SA.Build.entity.locationToBlockLocation(ctx.sender.location))
        .getComponent("inventory").container;
    for (const [i, k] of kit.entries()) {
      inv.setItem(
        i,
        new ItemStack(
          Items.get(
            k.split(" ")[0].includes(":")
              ? k.split(" ")[0]
              : "minecraft:" + k.split(" ")[0]
          ),
          Number(k.split(" ")[1]),
          Number(k.split(" ")[2])
        )
      );
    }
    ctx.reply(
      `§7Редактирование кита §6${name}§7! Когда закончишь, встань на сундук и пропиши §f-kit set ${name}`
    );
  });
new XA.Command(
  {
    name: "resetpos",
    description: "Удаляет информацию о позиции  на анархии",
    type: "public",
  },
  (ctx) => {
    ctx.reply(SA.tables.pos.delete(ctx.sender.name) + "");
  }
);
new XA.Command(
  {
    name: "radius",
    description: "Выдает радиус границы анархии сейчас",
    type: "public",
  },
  (ctx) => {
    ctx.reply(`☺ ${globalRadius}`);
  }
);
new XA.Command({ name: "sit", description: "", type: "public" }, (ctx) => {
  const entity = ctx.sender.dimension.spawnEntity(
    "s:it",
    new Location(
      ctx.sender.location.x,
      ctx.sender.location.y - 0.1,
      ctx.sender.location.z
    )
  );
  entity.addTag("sit:" + ctx.sender.name);
  ctx.sender.runCommand(
    `ride @s start_riding @e[type=s:it,tag="sit:${ctx.sender.name}",c=1] teleport_rider`
  );
});
const cos = new XA.Command({
  name: "i",
  description: "Создает динамический список предметов",
  tags: ["commands"],
  type: "test",
});
cos
  .addSubCommand({
    name: "add",
    description: "Добавляет предмет в руке в список",
  })
  .addOption("id", "string")
  .executes((ctx, { id }) => {
    ctx.reply(
      "Зарегано под айди: " +
        SA.tables.i.add(SA.Build.entity.getHeldItem(ctx.sender), id)
    );
  });
cos
  .addSubCommand({ name: "get" })
  .addOption("lore", "string")
  .executes((ctx, { lore }) => {
    SA.Build.entity
      .getI(ctx.sender)
      .setItem(ctx.sender.selectedSlot, SA.tables.i.get(lore));
  });
cos
  .addSubCommand({ name: "del" })
  .addOption("lore", "string")
  .executes((ctx, { lore }) => {
    ctx.reply(SA.tables.i.delete(lore));
  });
cos.addSubCommand({ name: "list" }, (ctx) => {
  const ii = SA.tables.i.items();
  if (ii.length > 1) {
    let ab = [];
    ii.filter((e) => ab.push(e.id + " (§r " + e.getLore().join(", ") + " §r)"));
    ctx.reply(ab.sort().join("\n"));
  } else {
    ctx.reply("§cПусто.");
  }
});
new XA.Command(
  { name: "cmd", description: "", tags: ["commands"], type: "test" },
  (ctx) => {
    const a = ctx.args;
    ctx.reply(a.join(" "));
    const ab = ctx.sender.runCommand(a.join(" "));
    ctx.reply(ab.statusMessage);
  }
);
new XA.Command(
  {
    name: "join",
    description: "Имитирует вход",
    tags: ["commands"],
    type: "test",
  },
  (ctx) => {
    ctx.sender.removeTag("WSeenJoinMessage");
    ctx.reply(
      "joinedAt:" +
        ctx.sender.location.x +
        " " +
        ctx.sender.location.y +
        " " +
        ctx.sender.location.z
    );
    SA.Build.entity.removeTagsStartsWith(ctx.sender, "joinedAt:");
    ctx.sender.addTag(
      "joinedAt:" +
        ctx.sender.location.x +
        " " +
        ctx.sender.location.y +
        " " +
        ctx.sender.location.z
    );
  }
);
new XA.Command(
  {
    name: "menu",
    description: "Выдает/убирает меню из инвентаря",
    type: "public",
  },
  (ctx) => {
    if (SA.Build.entity.hasItemm(ctx.sender, "mcbehub:gui")) {
      SA.Build.chat.runCommand(`clear "${ctx.sender.name}" mcbehub:gui`);
      ctx.reply("§a► §fМеню убрано.");
    } else {
      SA.Build.chat.runCommand(
        `give "${ctx.sender.name}" mcbehub:gui 1 0 {"item_lock":{"mode":"lock_in_inventory"}}`
      );
      ctx.reply("§a► §fМеню выдано.");
    }
  }
);
new XA.Command(
  {
    name: "ws",
    description: "Выдает/убирает меню из инвентаря",
    tags: ["owner"],
    type: "serv",
  },
  (ctx) => {
    if (SA.Build.entity.hasItemm(ctx.sender, "sa:a")) {
      SA.Build.chat.runCommand(`clear "${ctx.sender.name}" sa:a`);
      ctx.reply("§a► §fМеню убрано.");
    } else {
      SA.Build.chat.runCommand(`give "${ctx.sender.name}" sa:a`);
      ctx.reply("§a► §fМеню выдано.");
    }
  }
);
new XA.Command(
  { name: "s", description: "Выжа", tags: ["commands"], type: "serv" },
  (ctx) => {
    ctx.run("gamemode s");
    ctx.reply("§a► S");
  }
);
new XA.Command(
  { name: "c", description: "Креатив", tags: ["commands"], type: "serv" },
  (ctx) => {
    ctx.run("gamemode c");
    ctx.reply("§a► C");
  }
);
