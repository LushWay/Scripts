import {
  BlockLocation,
  Location,
  MinecraftBlockTypes,
  Player,
  // SoundOptions,
  world,
} from "@minecraft/server";
import { ScoreboardDB } from "../../lib/Class/Options.js";

/**======================
 **       ARRAYS
 *========================**/
import { setTickInterval, setTickTimeout, XA } from "xapi.js";

/**============================================
 **                  Стата
 *=============================================**/
export const stats = {
  Bplace: new ScoreboardDB("blockPlace", "Поставлено блок"),
  Bbreak: new ScoreboardDB("blockBreak", "Сломано блоков"),
  FVlaunc: new ScoreboardDB("FVlaunc", "Фв запущено"),
  FVboom: new ScoreboardDB("FVboom", "Фв взорвано"),
  Hget: new ScoreboardDB("Hget", "Урона получено"),
  Hgive: new ScoreboardDB("Hgive", "Урона нанесено"),
  kills: new ScoreboardDB("kills", "Убийств"),
  deaths: new ScoreboardDB("deaths", "Смертей"),
};

/**============================================
 **               Query объекты
 *=============================================**/

/**
 * @type {Object<String, Number>}
 */
export const InRaid = {};

setTickInterval(() => {
  for (const name of Object.keys(InRaid)) {
    //если игрок есть, надо выдать ему пвп режим
    if (XA.Entity.fetch(name)) {
      const pl = XA.Entity.fetch(name);
      if (XA.Entity.getScore(pl, "pvp") == 0) {
        pl.tell(
          "§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны."
        );
        pl.playSound("mob.wolf.bark");
      }
      XA.Chat.runCommand(
        `scoreboard players set "${pl.name}" pvp ${InRaid[name]}`
      );
      delete InRaid[name];
      return;
    }

    InRaid[name]--;
    //Время вышло, игрока не было
    if (InRaid[name] <= 0) {
      delete InRaid[name];
      return;
    }
  }
}, 20);

/*
|--------------------------------------------------------------------------
* -base
|--------------------------------------------------------------------------
|
TODO: Список доступных функций 
| 
| 
*/
const base = new XA.Command({
  name: "base",
  description: "Встаньте на сундук и запустите это, что бы создать базу",
});
base.executes((ctx) => {
  if (XA.Entity.getScore(ctx.sender, "pvp") > 0)
    return ctx.reply(
      "§4► §cПодождите еще §6" + XA.Entity.getScore(ctx.sender, "pvp") + " сек"
    );
  const basepos = XA.Entity.getTagStartsWith(ctx.sender, "base: ")
    ?.split(", ")
    ?.map((e) => parseInt(e));

  if (basepos) {
    const bl = new BlockLocation(basepos[0], basepos[1], basepos[2]);
    let ent = world
      .getDimension("overworld")
      ?.getEntitiesAtBlockLocation(bl)
      ?.find((e) => e.typeId == "s:base");

    if (ent) {
      return ctx.reply(
        "§7Доступные действия с базой на §6" +
          XA.Entity.getTagStartsWith(ctx.sender, "base: ") +
          ":\n§f  -base add - §o§7Добавить игрока. §fИгрок должен встать рядом с базой, а затем вы должны прописать это.§r" +
          "\n§f  -base remove <Имя игрока> - §o§7Удалить игрока.§r" +
          "\n§f  -base list - §o§7Список баз, в которые вы добавлены.§r" +
          "\n§7Что бы убрать базу, сломай бочку.§r"
      );
    } else XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
  }
  try {
    if (XA.Entity.getScore(ctx.sender, "inv") == 1)
      return ctx.reply("§cБазу можно поставить только на анархии");
    ctx.sender.runCommand("testforblock ~~~ chest");
  } catch (e) {
    return ctx.reply(
      "§cДля создания базы поставьте сундук, встаньте на него и напишите §f-base"
    );
  }
  if (
    XA.Entity.getClosetsEntitys(ctx.sender, 30, "s:base", 1, false).length > 1
  )
    return ctx.reply("§cРядом есть другие базы");
  const block = ctx.sender.dimension.getBlock(
    XA.Entity.locationToBlockLocation(ctx.sender.location)
  );
  block.setType(MinecraftBlockTypes.barrel);
  const entity = block.dimension.spawnEntity("s:base", block.location);
  entity.nameTag = ctx.sender.name;
  ctx.sender.addTag(
    "base: " +
      block.location.x +
      ", " +
      block.location.y +
      ", " +
      block.location.z
  );
  ctx.reply(
    "§7  База успешно зарегистрированна!\n\n  Теперь взаимодействовать с блоками в радиусе 20 блоков от базы можете только вы и добавленные пользователи(добавить: §f-base add§7)\n\n  Из блока базы (бочки) каждый час будет удалятся несколько предметов. Если в базе не будет никаких ресурсов, приват перестанет работать."
  );
});
base
  .literal({ name: "add", description: "Добавляет игрока" })
  .executes((ctx) => {
    if (XA.Entity.getScore(ctx.sender, "pvp") > 0)
      return ctx.reply(
        "§4► §cПодождите еще §6" +
          XA.Entity.getScore(ctx.sender, "pvp") +
          " сек"
      );
    const basepos = XA.Entity.getTagStartsWith(ctx.sender, "base: ")
      ?.split(", ")
      ?.map((e) => parseInt(e));
    if (!basepos)
      return ctx.reply(
        "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base"
      );
    const bl = new BlockLocation(basepos[0], basepos[1], basepos[2]);
    let ent = world
      .getDimension("overworld")
      ?.getEntitiesAtBlockLocation(bl)
      ?.find((e) => e.typeId == "s:base");

    if (!ent) {
      XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
      return ctx.reply(
        "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base§r"
      );
    }
    try {
      ent.runCommand(`testfor @p[name="${ctx.sender.nameTag}",r=20]`);
    } catch (e) {
      return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)");
    }
    const pl = XA.Entity.getClosetsEntitys(
      ent,
      1,
      "minecraft:player",
      1,
      false
    ).find((e) => e.nameTag != ctx.sender.name);
    if (!(pl instanceof Player))
      return ctx.reply(
        "§сРядом с базой должен стоять игрок, которого вы хотите добавить!"
      );
    ent.nameTag = ent.nameTag + ", " + pl.name;
    ctx.reply(`§6${pl.name}§7 добавлен в приват. Теперь там §6${ent.nameTag}`);
  });
base
  .literal({ name: "remove", description: "Удаляет игрока из базы" })
  .string("player")
  .executes((ctx, player) => {
    if (XA.Entity.getScore(ctx.sender, "pvp") > 0)
      return ctx.reply(
        "§4► §cПодождите еще §6" +
          XA.Entity.getScore(ctx.sender, "pvp") +
          " сек"
      );
    const basepos = XA.Entity.getTagStartsWith(ctx.sender, "base: ")
      ?.split(", ")
      ?.map((e) => parseInt(e));
    if (!basepos)
      return ctx.reply(
        "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base"
      );
    const bl = new BlockLocation(basepos[0], basepos[1], basepos[2]);
    let ent = world
      .getDimension("overworld")
      .getEntitiesAtBlockLocation(bl)
      .find((e) => e.typeId == "s:base");
    if (!ent) {
      XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
      return ctx.reply(
        "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base§r"
      );
    }
    try {
      ent.runCommand(`testfor @p[name="${ctx.sender.nameTag}",r=20]`);
    } catch (e) {
      return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)§r");
    }
    const arr = ent.nameTag.split(", ");
    if (!arr.includes(player))
      return ctx.reply(
        `§сИгрока §f${player}§c нет в привате. Там есть только: §f${ent.nameTag}`
      );
    let arr2 = [];
    arr.forEach((e) => {
      if (e != player) arr2.push(e);
    });
    if (arr2.length < 1)
      return ctx.reply("§cВ привате должен быть хотя бы один игрок.");
    if (player == ctx.sender.nameTag) {
      let igr;
      for (const pl of arr2) {
        if (XA.Entity.fetch(pl)) igr = XA.Entity.fetch(pl);
      }
      if (!igr)
        return ctx.reply(
          "§cПри удалении себя из привата нужно что бы хотя бы один игрок в привате был онлайн."
        );
      igr.addTag("base: " + XA.Entity.getTagStartsWith(ctx.sender, "base: "));
      igr.tell(
        `§7Вам переданы права управления базой на §6${XA.Entity.getTagStartsWith(
          ctx.sender,
          "base: "
        )}`
      );
      XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
    }
    ent.nameTag = arr2.join(", ");
    ctx.reply(`§6${player}§7 удален из в привата. Теперь там §6${ent.nameTag}`);
  });
base.literal({ name: "list", description: "Список баз" }).executes((ctx) => {
  if (XA.Entity.getScore(ctx.sender, "pvp") > 0)
    return ctx.reply(
      "§4► §cПодождите еще §6" + XA.Entity.getScore(ctx.sender, "pvp") + " сек"
    );
  const basepos = XA.Entity.getTagStartsWith(ctx.sender, "base: ")
    ?.split(", ")
    ?.map((e) => parseInt(e));
  if (!basepos)
    return ctx.reply(
      "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base"
    );
  const bl = new BlockLocation(basepos[0], basepos[1], basepos[2]);
  let ent = world
    .getDimension("overworld")
    .getEntitiesAtBlockLocation(bl)
    .find((e) => e.typeId == "s:base");
  if (!ent) {
    XA.Entity.removeTagsStartsWith(ctx.sender, "base: ");
    return ctx.reply(
      "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base§r"
    );
  }
  try {
    ent.runCommand(`testfor @p[name="${ctx.sender.name}",r=20]`);
  } catch (e) {
    return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)");
  }
  ctx.reply(`§7В привате базы есть такие игроки: §6${ent.nameTag}`);
});

world.events.blockBreak.subscribe((data) => {
  const ent = XA.Entity.getClosetsEntitys(data.player, 20, "s:base", 1, false);
  if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
    return stats.Bbreak.Eadd(data.player, 1);
  data.dimension
    .getBlock(data.block.location)
    .setPermutation(data.brokenBlockPermutation.clone());
  data.player.tell("§cПриват игрока " + ent[0].nameTag.split(", ")[0]);
  const bl = data.block.location;
  setTickTimeout(() => {
    XA.Chat.runCommand(`kill @e[type=item,x=${bl.x},z=${bl.z},y=${bl.y},r=2]`);
  }, 1);
});

world.events.blockPlace.subscribe((data) => {
  const ent = XA.Entity.getClosetsEntitys(data.player, 20, "s:base", 1, false);
  if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
    return stats.Bplace.Eadd(data.player, 1);
  const bl = data.block.location;
  XA.Chat.runCommand(
    `fill ${bl.x} ${bl.y} ${bl.z} ${bl.x} ${bl.y} ${bl.z} air 0 destroy`
  );
  data.player.tell("§cПриват игрока " + ent[0].nameTag.split(", ")[0]);
  console.warn(data.block.permutation.getAllProperties());
});

world.events.beforeExplosion.subscribe((data) => {
  if (!data.impactedBlocks[0]) return;
  const e = {},
    loc = data.impactedBlocks.find((e) => e && e.x);
  e.location = new Location(loc.x, loc.y, loc.z);
  const ent = XA.Entity.getClosetsEntitys(e, 20, "s:base", 1, false);
  if (ent.length < 1) return;
  for (const name of ent[0].nameTag.split(", ")) InRaid[name] = 60;
});
