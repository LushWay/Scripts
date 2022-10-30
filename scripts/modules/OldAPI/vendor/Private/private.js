import {
  BlockLocation,
  BlockRaycastOptions,
  // ExplosionOptions,
  Items,
  ItemStack,
  Location,
  MinecraftBlockTypes,
  MolangVariableMap,
  Player,
  PlayerInventoryComponentContainer,
  // SoundOptions,
  world,
} from "@minecraft/server";
import { wow } from "../../app/Models/Options.js";

/**======================
 **       ARRAYS
 *========================**/
import { SA } from "../../index.js";
import { XA } from "xapi.js";

/**============================================
 **                  Стата
 *=============================================**/
export const stats = {
  Bplace: new wow("blockPlace", "Поставлено блок"),
  Bbreak: new wow("blockBreak", "Сломано блоков"),
  FVlaunc: new wow("FVlaunc", "Фв запущено"),
  FVboom: new wow("FVboom", "Фв взорвано"),
  Hget: new wow("Hget", "Урона получено"),
  Hgive: new wow("Hgive", "Урона нанесено"),
  kills: new wow("kills", "Убийств"),
  deaths: new wow("deaths", "Смертей"),
};

/**============================================
 **               Query объекты
 *=============================================**/

/**
 * @type {Object<String, Number>}
 */
export const InRaid = {};
SA.Utilities.time.setTickInterval(() => {
  for (const name of Object.keys(InRaid)) {
    //если игрок есть, надо выдать ему пвп режим
    if (SA.Build.entity.fetch(name)) {
      const pl = SA.Build.entity.fetch(name);
      if (SA.Build.entity.getScore(pl, "pvp") == 0) {
        pl.tell(
          "§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны."
        );
        pl.playSound("mob.wolf.bark");
      }
      SA.Build.chat.runCommand(
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
const base = new XA.Command(
  {
    name: "base",
    description: "Встаньте на сундук и запустите это, что бы создать базу",
  }
)
base.executes((ctx) => {
    if (SA.Build.entity.getScore(ctx.sender, "pvp") > 0)
      return ctx.reply(
        "§4► §cПодождите еще §6" +
          SA.Build.entity.getScore(ctx.sender, "pvp") +
          " сек"
      );
    const basepos = SA.Build.entity
      .getTagStartsWith(ctx.sender, "base: ")
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
            SA.Build.entity.getTagStartsWith(ctx.sender, "base: ") +
            ":\n§f  -base add - §o§7Добавить игрока. §fИгрок должен встать рядом с базой, а затем вы должны прописать это.§r" +
            "\n§f  -base remove <Имя игрока> - §o§7Удалить игрока.§r" +
            "\n§f  -base list - §o§7Список баз, в которые вы добавлены.§r" +
            "\n§7Что бы убрать базу, сломай бочку.§r"
        );
      } else SA.Build.entity.removeTagsStartsWith(ctx.sender, "base: ");
    }
    try {
      if (SA.Build.entity.getScore(ctx.sender, "inv") == 1)
        return ctx.reply("§cБазу можно поставить только на анархии");
      ctx.sender.runCommand("testforblock ~~~ chest");
    } catch (e) {
      return ctx.reply(
        "§cДля создания базы поставьте сундук, встаньте на него и напишите §f-base"
      );
    }
    if (
      SA.Build.entity.getClosetsEntitys(ctx.sender, 30, "s:base", 1, false)
        .length > 1
    )
      return ctx.reply("§cРядом есть другие базы");
    const block = ctx.sender.dimension.getBlock(
      SA.Build.entity.locationToBlockLocation(ctx.sender.location)
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
  }
);
base.literal({ name: "add", description: "Добавляет игрока" }).executes((ctx) => {
  if (SA.Build.entity.getScore(ctx.sender, "pvp") > 0)
    return ctx.reply(
      "§4► §cПодождите еще §6" +
        SA.Build.entity.getScore(ctx.sender, "pvp") +
        " сек"
    );
  const basepos = SA.Build.entity
    .getTagStartsWith(ctx.sender, "base: ")
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
    SA.Build.entity.removeTagsStartsWith(ctx.sender, "base: ");
    return ctx.reply(
      "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base§r"
    );
  }
  try {
    ent.runCommand(`testfor @p[name="${ctx.sender.nameTag}",r=20]`);
  } catch (e) {
    return ctx.reply("§сТы слишком далеко от базы! (Вне зоны привата)");
  }
  const pl = SA.Build.entity
    .getClosetsEntitys(ent, 1, "minecraft:player", 1, false)
    .find((e) => e.nameTag != ctx.sender.name);
  if (!(pl instanceof Player))
    return ctx.reply(
      "§сРядом с базой должен стоять игрок, которого вы хотите добавить!"
    );
  ent.nameTag = ent.nameTag + ", " + pl.name;
  ctx.reply(`§6${pl.name}§7 добавлен в приват. Теперь там §6${ent.nameTag}`);
});
base
  .addSubCommand({ name: "remove", description: "Удаляет игрока из базы" })
  .addOption("player", "string")
  .executes((ctx, { player }) => {
    if (SA.Build.entity.getScore(ctx.sender, "pvp") > 0)
      return ctx.reply(
        "§4► §cПодождите еще §6" +
          SA.Build.entity.getScore(ctx.sender, "pvp") +
          " сек"
      );
    const basepos = SA.Build.entity
      .getTagStartsWith(ctx.sender, "base: ")
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
      SA.Build.entity.removeTagsStartsWith(ctx.sender, "base: ");
      return ctx.reply(
        "§cУ вас нету базы. Для создания поставьте сундук, встаньте на него и напишите §f-base§r"
      );
    }
    try {
      ent.runCommand(`testfor @p[name="${ctx.sender.name}",r=20]`);
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
    if (player == ctx.sender) {
      let igr;
      for (const pl of arr2) {
        if (SA.Build.entity.fetch(pl)) igr = SA.Build.entity.fetch(pl);
      }
      if (!igr)
        return ctx.reply(
          "§cПри удалении себя из привата нужно что бы хотя бы один игрок в привате был онлайн."
        );
      igr.addTag(
        "base: " + SA.Build.entity.getTagStartsWith(ctx.sender, "base: ")
      );
      igr.tell(
        `§7Вам переданы права управления базой на §6${SA.Build.entity.getTagStartsWith(
          ctx.sender,
          "base: "
        )}`
      );
      SA.Build.entity.removeTagsStartsWith(ctx.sender, "base: ");
    }
    ent.nameTag = arr2.join(", ");
    ctx.reply(`§6${player}§7 удален из в привата. Теперь там §6${ent.nameTag}`);
  });
base.addSubCommand({ name: "list", description: "Список баз" }, (ctx) => {
  if (SA.Build.entity.getScore(ctx.sender, "pvp") > 0)
    return ctx.reply(
      "§4► §cПодождите еще §6" +
        SA.Build.entity.getScore(ctx.sender, "pvp") +
        " сек"
    );
  const basepos = SA.Build.entity
    .getTagStartsWith(ctx.sender, "base: ")
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
    SA.Build.entity.removeTagsStartsWith(ctx.sender, "base: ");
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
  const ent = SA.Build.entity.getClosetsEntitys(
    data.player,
    20,
    "s:base",
    1,
    false
  );
  if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
    return stats.Bbreak.Eadd(data.player, 1);
  data.dimension
    .getBlock(data.block.location)
    .setPermutation(data.brokenBlockPermutation.clone());
  data.player.tell("§cПриват игрока " + ent[0].nameTag.split(", ")[0]);
  const bl = data.block.location;
  SA.Utilities.time.setTickTimeout(() => {
    SA.Build.chat.runCommand(
      `kill @e[type=item,x=${bl.x},z=${bl.z},y=${bl.y},r=2]`
    );
  }, 1);
});

world.events.blockPlace.subscribe((data) => {
  const ent = SA.Build.entity.getClosetsEntitys(
    data.player,
    20,
    "s:base",
    1,
    false
  );
  if (ent.length < 1 || ent[0].nameTag.split(", ").includes(data.player.name))
    return stats.Bplace.Eadd(data.player, 1);
  const bl = data.block.location;
  SA.Build.chat.runCommand(
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
  const ent = SA.Build.entity.getClosetsEntitys(e, 20, "s:base", 1, false);
  if (ent.length < 1) return;
  for (const name of ent[0].nameTag.split(", ")) InRaid[name] = 60;
});
