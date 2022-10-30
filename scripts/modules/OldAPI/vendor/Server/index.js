import {
  BlockLocation,
  BlockRaycastOptions,
  EnchantmentList,
  Items,
  ItemStack,
  Location,
  // @ts-ignore
  MinecraftBlockTypes,
  Player,
  MinecraftEnchantmentTypes,
  MolangVariableMap,
  PlayerInventoryComponentContainer,
  world,
} from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

/**======================
 **       OPTIONS
 *========================**/
import { po, wo, wow } from "../../app/Models/Options.js";

/**======================
 **       ARRAYS
 *========================**/
import { P } from "../../config/particles.js";
import { S } from "../../config/sounds.js";
import { SA } from "../../index.js";
import { XA } from "xapi.js";

/**======================
 **       PLUGINS
 *========================**/
import "./commands/other.js";
import "./commands/id.js";
import "./commands/lore.js";
import "./commands/particle.js";
import "./commands/sound.js";
import "./commands/world.js";
import "./options.js";
import "../Private/private.js";
import { Atp } from "../Portals/index.js";
import { stringifyEx } from "../../app/Utilities/formatter.js";
import { stats } from "../Private/private.js";
/*------------------------------------------ КОНЕЦ ИМПОРТОВ ------------------------------------------*/

/**
 *
 *
 *
 *
 *
 *
 */
/**
 * Выводит строку времени
 * @returns {String}
 */
export function timeNow() {
  const time = Number(String(new Date(Date())).split(" ")[4].split(":")[0]) + 3;
  if (time < 6) return "§dДоброй ночи";
  if (time < 12) return "§6Доброе утро";
  if (time < 18) return "§bДобрый день";
  return "§3Добрый вечер";
}

/**
 * Выводит время в формате 00:00
 * @returns {String}
 */
export function shortTime() {
  const time = Number(String(new Date(Date())).split(" ")[4].split(":")[0]) + 3,
    min = String(new Date(Date())).split(" ")[4].split(":")[1];
  return `${time}:${min.length == 2 ? min : "0" + min}`;
}

/**==============================================
 **              return
 *?  Тепает назад в зону
 *@param name type
 *@param name type
 *@return type
 *=============================================**/
/**
 *
 * @param {Player} pl
 * @param {boolean} isX
 * @param {BlockLocation} zone
 * @param {boolean} [plus]
 */
function ret(pl, isX, zone, plus) {
  const a = isX
    ? `${plus ? zone.x + 1 : zone.x - 1} ${pl.location.y} ${pl.location.z}`
    : `${pl.location.x} ${pl.location.y} ${plus ? zone.z + 1 : zone.z - 1}`;
  SA.Build.chat.rcs([
    `tp "${pl.name}" ${a}`,
    `title "${pl.name}" actionbar §cОграничение мира до: §f${
      isX ? zone.x : zone.z
    }${isX ? "x" : "z"}`,
  ]);
}
/**
 *
 * @param {Player} pl
 * @param {boolean} isX
 * @param {BlockLocation} zone
 */
function pret(pl, isX, zone) {
  const a = isX
    ? `${zone.x} ${Math.floor(pl.location.y) + 1} ${Math.floor(pl.location.z)}`
    : `${Math.floor(pl.location.x)} ${Math.floor(pl.location.y) + 1} ${zone.z}`;
  SA.Build.chat.rcs([
    `particle minecraft:falling_border_dust_particle ${a}`,
    `particle minecraft:rising_border_dust_particle ${a}`,
  ]);
}
/**
 *
 *
 *
 *
 *
 *
 */

/**============================================
 **               Таймеры
 *=============================================**/
export const Allhrs = new wow("Allhrs", "Часов в игре");
export const Allmin = new wow("Allmin", "Минут в игре");
export const Allsec = new wow("Allsec", "Секунд в игре");
export const Dayhrs = new wow("Dayhrs", "Часов за день");
export const Daymin = new wow("Daymin", "Минут за день");
export const Daysec = new wow("Daysec", "Секунд за день");
export const Seahrs = new wow("Seahrs", "Часов анархия");
export const Seamin = new wow("Seamin", "Минут анархия");
export const Seasec = new wow("Seasec", "Секунд анархия");
/*=============== END OF SECTION ==============*/

/*=== Глобальный радиус ===*/
export let globalRadius = 200;
/*==== END OF SECTION ====*/

/**============================================
 **               Query объекты
 *=============================================**/
/**
 * @type {import("@minecraft/server").EntityQueryOptions}
 */
const qq = { type: "fireworks_rocket" };

/**
 * @type {import("@minecraft/server").EntityQueryOptions}
 */
const no = { type: "s:base" };

/**
 * @type {import("@minecraft/server").ExplosionOptions}
 */
const boom = {
  breaksBlocks: false,
  causesFire: true,
};
/*=============== END OF SECTION ==============*/

/**
 *
 *
 *
 *
 *
 *
 */

//*Немного скорбордов
SA.Build.chat.runCommand("scoreboard players reset * perm");
SA.Build.chat.runCommand("scoreboard objectives add join dummy");

const arraspdk = ["^^^1", "^^^2", "~~~", "~~-1~", "~~1~"]; //

// for (let x = -1; x <= 1; x++) {
//   for (let y = -1; y <= 1; y++) {
//     for (let z = -1; z <= 1; z++) {
//       if (x+y+z == x*3) continue
//       arraspdk.push(`~${x!=0?x:''}~${y!=0?y:''}~${z!=0?z:''}`)
//     }
//   }
// }
// world.say(arraspdk.join(', '))

/**
 *
 * @param {BlockLocation} center
 * @param {BlockLocation} pos
 * @param {number} r
 * @returns
 */
const isInRad = (center, pos, r) => {
  const cx = center.x,
    cy = center.y,
    cz = center.z;
  const { x, y, z } = pos;
  return (
    x <= r + cx &&
    y <= r + cy &&
    z <= r + cz &&
    x <= r - cx &&
    y <= r - cy &&
    z <= r - cz
  );
};

function check(f) {
  try {
    arraspdk.forEach((e) => f.runCommand(`testforblock ${e} air`));
    return true;
  } catch (e) {
    return false;
  }
}

/*=========================================== ВЗРЫВНЫЕ ФЕЙРВЕРКИ ===========================================*/
SA.Utilities.time.setTickInterval(() => {
  for (const f of world.getDimension("overworld").getEntities(qq)) {
    if (
      isInRad(
        //@ts-ignore
        new BlockLocation(...wo.Q("spawn:pos").split(" ")),
        SA.Build.entity.locationToBlockLocation(f.location),
        200
      )
    )
      continue;
    if (
      isInRad(
        //@ts-ignore
        new BlockLocation(...wo.Q("minigames:pos").split(" ")),
        SA.Build.entity.locationToBlockLocation(f.location),
        50
      )
    )
      continue;
    if (!SA.Build.entity.getTagStartsWith(f, "l:")) {
      const sender = SA.Build.entity.getClosetsEntitys(
        f,
        2,
        "minecraft:player",
        1,
        false
      )[0];
      if (sender instanceof Player) {
        const lore = SA.Build.entity.getHeldItem(sender).getLore()[0];
        if (!lore || lore == "§r§н") continue;
        if (lore == "§r§б") f.addTag("блоки");
        if (lore == "§r§и") f.addTag("игроки");
        stats.FVlaunc.Eadd(sender, 1);
        f.addTag("l:" + sender.name);
      }
    }
    // const id = f.dimension.getBlock(
    //     SA.Build.entity.locationToBlockLocationn(f.location)
    //   ).id,
    //   id2 = f.dimension.getBlock(
    //     SA.Build.entity.locationToBlockLocationn(
    //       new Location(
    //         f.location.x,
    //         Math.round(f.location.y + 0.8),
    //         f.location.z
    //       )
    //     )
    //   ).id,
    //   id3 = f.dimension.getBlock(
    //     SA.Build.entity.locationToBlockLocationn(
    //       new Location(
    //         f.location.x,
    //         Math.round(f.location.y - 0.8),
    //         f.location.z
    //       )
    //     )
    //   ).id;
    // if (
    //   id == "minecraft:air" &&
    //   id2 == "minecraft:air" &&
    //   id3 == "minecraft:air"
    // )
    //   continue;
    const type = f.hasTag("блоки") ? 2 : f.hasTag("игроки") ? 3 : 0;
    //console.warn(type);
    if (type == 0) continue;
    if (type == 2) {
      if (check(f)) {
        continue;
      } else boom.breaksBlocks = true;
    }

    if (type == 3)
      try {
        f.runCommand("testforblock ^^^1 air");
        f.runCommand("testforblock ^^^2 air");
        continue;
      } catch (e) {}
    let a = [...world.getPlayers()].find(
      (e) => e.name == SA.Build.entity.getTagStartsWith(f, "l:")
    );
    // world.say(a.name);
    if (a) stats.FVboom.Eadd(a, 1);
    f.dimension.createExplosion(f.location, type, boom);
    f.kill();
    boom.breaksBlocks = false;
  }
});

/**================================================================================================
 **                                           КАЖДЫЕ 0 ТИКОВ
 *  Не дeлайте тут много вложенных циклов, пжжпжп
 *
 *
 *
 *================================================================================================**/
SA.Utilities.time.setTickInterval(
  () => {
    /*================================================================================================*/

    /*=========================================== ЗОНА ===========================================*/
    let rad = 200;
    const center = wo.Q("zone:center")
      ? //@ts-ignore
        wo.Q("zone:center").split(", ")
      : [0, 0];
    // @ts-ignore
    for (const p of world.getPlayers()) {
      rad = rad + 20;
    }
    for (const p of world.getPlayers()) {
      const rmax = new BlockLocation(
          Number(center[0]) + rad,
          0,
          Number(center[1]) + rad
        ),
        rmin = new BlockLocation(
          Number(center[0]) - rad,
          0,
          Number(center[1]) - rad
        );
      const l = SA.Build.entity.locationToBlockLocation(p.location);
      if (l.x >= rmax.x && l.x <= rmax.x + 10 && l.z <= rmax.z && l.z >= rmin.z)
        ret(p, true, rmax);
      if (l.x >= rmax.x - 10 && l.x <= rmax.x && l.z <= rmax.z && l.z >= rmin.z)
        pret(p, true, rmax);

      if (l.z >= rmax.z && l.z <= rmax.z + 10 && l.x <= rmax.x && l.x >= rmin.x)
        ret(p, false, rmax);
      if (l.z >= rmax.z - 10 && l.z <= rmax.z && l.x <= rmax.x && l.x >= rmin.x)
        pret(p, false, rmax);

      if (l.x <= rmin.x && l.x >= rmin.x - 10 && l.z <= rmax.z && l.z >= rmin.z)
        ret(p, true, rmin, true);
      if (l.x <= rmin.x + 10 && l.x >= rmin.x && l.z <= rmax.z && l.z >= rmin.z)
        pret(p, true, rmin);

      if (l.z <= rmin.z && l.z >= rmin.z - 10 && l.x <= rmax.x && l.x >= rmin.x)
        ret(p, false, rmin, true);
      if (l.z <= rmin.z + 10 && l.z >= rmin.z && l.x <= rmax.x && l.x >= rmin.x)
        pret(p, false, rmin);

      if (
        l.z <= rmin.z &&
        l.x <= rmin.x &&
        l.x <= rmax.x &&
        l.x >= rmin.x &&
        SA.Build.entity.getScore(p, "inv") != 2 &&
        !p.hasTag("saving") &&
        !p.hasTag("br:ded")
      ) {
        Atp(p, "anarch", true);
      }
    }
    //* Обновляем глобальный радиус до актуального
    globalRadius = rad;

    SA.Build.chat.rcs([
      'scoreboard objectives add perm dummy "§6скрой это табло"',
      `scoreboard objectives add lockedtitle dummy`,
      `scoreboard players add @a lockedtitle 0`,
    ]);
    for (const pl of world.getPlayers())
      try {
        pl.runCommand(
          'execute as @s[tag=!"br:inGame"] if block ~ -64 ~ deny 0 run event entity @s spawn'
        );
      } catch (E) {}
    const q = {};
    q.families = ["monster"];
    for (const ent of world.getDimension("overworld").getEntities(q))
      try {
        ent.runCommand(
          "execute if block ~ -64 ~ deny run testfor @s[family=monster]"
        );
        SA.Build.entity.despawn(ent);
      } catch (e) {}
  },
  0,
  "server0"
);

/*
|--------------------------------------------------------------------------
* * Каждые 10 тиков
|--------------------------------------------------------------------------
| 
| Фильтр инвентаря, Пвп мод, При входе, Блокировка незера и Разрешения
| 
*/
SA.Utilities.time.setTickInterval(
  async () => {
    let players = [];
    for (const p of world.getPlayers()) {
      players.push(p.name);

      //*Фильтр предметов в инвентаре для Chest Gui
      /**
       * @type {PlayerInventoryComponentContainer}
       */
      // @ts-ignore
      const inv = p.getComponent("minecraft:inventory").container;
      for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i),
          lore = item?.getLore();
        let lastInd, lastLore;
        if (lore) (lastInd = lore.length - 1), (lastLore = lore[lastInd]);
        if (
          item &&
          (item?.nameTag?.startsWith("§r§m§n§m") ||
            item?.nameTag?.startsWith("§m§n§m") ||
            (lastLore && lastLore?.endsWith("§{§-§}")))
        ) {
          const item2 = new ItemStack(
            Items.get(item.typeId),
            item.amount,
            item.data
          );
          inv.setItem(i, item2);
        }
        if (item && item.typeId == "minecraft:crossbow") {
          /**
           * @type {EnchantmentList}
           */
          let ench = item.getComponent("enchantments").enchantments,
            o = false;
          const mm = ench.getEnchantment(MinecraftEnchantmentTypes.multishot),
            m = ench.getEnchantment(MinecraftEnchantmentTypes.piercing);
          if (m)
            item.setLore(["§r§б", "§r§fЦель ракет: §6блоки"]),
              (o = true),
              (item.nameTag = "§r§fРазрывная");
          if (mm)
            item.setLore(["§r§и", "§r§fЦель ракет: §6игроки"]),
              (o = true),
              (item.nameTag = "§r§fПодрыв жоп");
          if (!o)
            item.setLore([
              "§r§н",
              "§r§fБронебойность: §6блоки",
              "§r§fТройной выстрел: §6игроки",
            ]);
          inv.setItem(i, item);
        }
      }

      /*================================ PVP MODE ==============================*/
      if (
        wo.Q("server:pvpmode:enable") &&
        po.Q("title:pvpmode", p) &&
        !SA.Build.entity.getTagStartsWith(p, "lockpvp:") &&
        SA.Build.entity.getScore(p, "pvp") > 0
      ) {
        const score = SA.Build.entity.getScore(p, "pvp");
        const max = wo.Q("server:pvpmode:cooldown") ?? 15;
        const q = score == max;
        try {
          p.runCommand(
            `title @s[scores={lockedtitle=0}] actionbar ${
              q ? "§4»" : ""
            } §6PvP: ${score} ${q ? "§4«" : ""}`
          );
        } catch (e) {}
      }
      /*========================================================================*/

      /*================================ ON JOIN ==============================*/
      if (SA.Build.entity.getTagStartsWith(p, "joinedAt:")) {
        const pos = SA.Build.entity
          .getTagStartsWith(p, "joinedAt:")
          .split(" ")
          .map((e) => parseInt(e));
        const message =
          wo
            .G("spawn:message")
            ?.replace("$name", p.name)
            ?.replace("$время", timeNow())
            ?.replace("$time", shortTime()) ??
          `${timeNow()}, ${p.name}!\n§9Время • ${shortTime()}`;
        if (
          p.location.x == pos[0] &&
          p.location.y == pos[1] &&
          p.location.z == pos[2]
        ) {
          if (p.hasTag("on_ground")) {
            SA.Build.chat.runCommand(
              "scoreboard objectives add animStage1 dummy"
            );
            const q = SA.Build.entity.getScore(p, "animStage1");
            let start;
            const co = wo.Q("spawn:animcolor") ?? "§f";
            q <= 5 ? (start = `${co}»  `) : (start = `${co}» `);
            let end;
            q <= 5 ? (end = `  ${co}«`) : (end = ` ${co}«`);
            p.runCommand("title @s times 0 120 0");
            p.runCommand(
              `title @s actionbar ${
                wo.Q("spawn:actionbar") ?? "§eСдвинься что бы продолжить"
              }`
            );
            p.runCommand(
              `title @s title ${start}${
                wo.Q("spawn:title") ?? "§aServer"
              }${end}`
            );
            p.runCommand(
              `title @s subtitle ${
                wo.Q("spawn:subtitle") ?? "Добро пожаловать!"
              }`
            );
            q == 0
              ? p.runCommand("scoreboard players set @s animStage1 10")
              : p.runCommand("scoreboard players add @s animStage1 -2");
          } else {
            SA.Build.entity.removeTagsStartsWith(p, "joinedAt:");

            SA.Build.chat.rcs([
              `tellraw @a[tag=!"another:join:disable",name=!"${p.name}"] {"rawtext":[{"translate":"§7${p.name} §8Очнулся в воздухе"}]}`,
              `scoreboard players add "${p.name}" join 1`,
              `playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
            ]);
            p.tell(message);
            p.addTag("WSeenJoinMessage");
            p.runCommand("title @s clear");
          }
        } else if (!p.hasTag("WSeenJoinMessage")) {
          SA.Build.entity.removeTagsStartsWith(p, "joinedAt:");
          SA.Build.chat.rcs([
            `tellraw @a[tag=!"another:join:disable",name=!"${p.name}"] {"rawtext":[{"translate":"§7${p.name} §8Сдвинулся"}]}`,
            `playsound break.amethyst_cluster @a[tag=!"joinsound:disable"]`,
            `scoreboard players add "${p.name}" join 1`,
          ]);
          p.tell(message);
          p.addTag("WSeenJoinMessage");
          p.runCommand("title @s clear");
        }
      }
      if (!p.hasTag("WSeenLearning") && p.hasTag("WSeenJoinMessage")) {
        const f = new ActionFormData();
        f.title("Краткий гайд");
        f.body(
          wo
            .G("joinform:body")
            ?.replace("$name", p.name)
            ?.replace("$time", timeNow()) ??
            `${timeNow()}, ${
              p.name
            }!\n§7Для навигации по серверу используется §fменю§7 (зачарованный алмаз в инвентаре).\n  Что бы открыть меню, возьми его в руку и §fиспользуй§7 (зажми на телефоне, ПКМ на пк)\n\n  Помимо него есть еще кастомные §fкоманды§7.\n  Все они вводятся в чат и должны начинаться с '-'.\n  Что бы получить список всех доступных команд пропиши в чат §f-help§7.\n\n\nНажми одну из кнопок внизу, если прочитал гайд.`
        );
        f.button("Выход");
        const ActionFormResponse = await f.show(p);
        if (
          ActionFormResponse.canceled &&
          ActionFormResponse.cancelationReason !==
            FormCancelationReason.userBusy
        )
          return p.tell(
            `А прочитать слабо было? Если все же хочешь прочитать гайд и не задавать вопросы в чате напиши §f-info`
          );
        p.addTag("WSeenLearning");
      }
      /*========================================================================*/

      /*================== Блокировка незера =================*/
      if (wo.Q("lock:nether")) {
        try {
          p.runCommand(`testforblock ~~~ portal`);
          p.runCommand(
            `tellraw @a {"rawtext":[{"text":"§c► §f${p.name}§c Измерение ''Незер'' заблокированно."}]}`
          );
          p.runCommand(`fill ~-2~-2~-2 ~2~2~2 air 0 replace portal`);
        } catch (e) {}
      }
    }
    /*================================ DEBUG2 ==============================*/
    if (wo.Q("debug:menu")) {
      const q = {};
      q.type = "mcbehub:inventory";
      for (const ent of world.getDimension("overworld").getEntities(q)) {
        ent.runCommand("particle minecraft:endrod ~~~");
      }
    }
    /*========================================================================*/
    /*================================ Разрешения ==============================*/
    const владельцы = wo.Q("perm:владельцы")
      ? wo.G("perm:владельцы")?.split(", ")
      : ["XilLeR228", "Shp1nat8479"];
    const модеры = wo.Q("perm:модеры")
      ? wo.G("perm:модеры")?.split(", ")
      : ["CosmoxS17193"];
    let perm = [];
    for (const v of владельцы) {
      if (!players.includes(v)) continue;
      SA.Build.chat.rcs([
        `scoreboard players set "${v}" perm 2`,
        `tag "${v}" add owner`,
        `tag "${v}" add commands`,
        `tag "${v}" remove moder`,
        `op "${v}"`,
      ]);
      perm.push(v);
    }
    for (const v of модеры) {
      if (!players.includes(v)) continue;
      SA.Build.chat.rcs([
        `scoreboard players set "${v}" perm 1`,
        `tag "${v}" add commands`,
        `tag "${v}" add moder`,
        `tag "${v}" remove owner`,
        `op "${v}"`,
      ]);
      perm.push(v);
    }
    for (const v of players) {
      if (perm.includes(v)) continue;
      SA.Build.chat.rcs([
        `scoreboard players set "${v}" perm 0`,
        `tag "${v}" remove owner`,
        `tag "${v}" remove commands`,
        `tag "${v}" remove moder`,
        `deop "${v}"`,
      ]);
    }
  },
  10,
  "server10"
);

/*
|--------------------------------------------------------------------------
* * Каждую секунду
|--------------------------------------------------------------------------
|
| -sit, -base, TOOL, PVP -sec, Другие таймеры
| 
*/
SA.Utilities.time.setTickInterval(
  () => {
    /*================== -sit доработка =================*/
    for (const e of SA.Build.world.getEntitys()) {
      if (e.typeId != "s:it") continue;
      const pl = SA.Build.entity.getClosetsEntitys(
        e,
        1,
        "minecraft:player",
        1,
        false
      );
      if (pl.length < 1) e.triggerEvent("kill");
    }
    /*===================================================*/

    /*================== -base доработка =================*/
    for (const e of world.getDimension("overworld").getEntities(no)) {
      const block = e.dimension.getBlock(
        SA.Build.entity.locationToBlockLocation(e.location)
      );
      if (block && block.typeId == "minecraft:barrel") continue;
      e.nameTag
        .split(", ")
        // @ts-ignore
        .forEach((e, i, a) =>
          SA.Build.entity
            .fetch(e)
            .tell("§cБаза с владельцем §f" + a[0] + "§c разрушена.")
        );
      e.triggerEvent("kill");
    }
    /*===================================================*/
    for (const p of world.getPlayers()) {
      let q = true;
      //* Переключение инвентаря
      if (q)
        try {
          p.runCommand(
            `execute positioned ${wo.Q("spawn:pos")} run testfor @p[name="${
              p.name
            }",scores={inv=!1},r=200,tag=!"br:ded"]`
          );
          q = false;
          Atp(p, "spawn", true);
          SA.tables.pos.delete(p.name);
        } catch (e) {}
      if (q)
        try {
          p.runCommand(
            `execute positioned ${wo.Q("minigames:pos")} run testfor @p[name="${
              p.name
            }",scores={inv=!1},r=200,tag=!"br:ded"]`
          );
          q = false;
          Atp(p, "minigames", true);
        } catch (e) {}
      if (q)
        try {
          p.runCommand(
            `execute as @s if block ~ -64 ~ deny 0 run testfor @p[name="${p.name}",scores={inv=!1},tag=!"br:ded"]`
          );
          q = false;
          Atp(p, "currentpos", true);
        } catch (e) {}
      /*================ TOOL FUNCTIONS ===================*/
      if (SA.Build.entity.getHeldItem(p)?.typeId == "we:tool") {
        const lore = SA.Build.entity.getHeldItem(p).getLore();
        if (lore[0] == "Particle") {
          const q = new BlockRaycastOptions();
          q.maxDistance = 100;
          const block = p.getBlockFromViewVector(q);
          if (block) {
            world
              .getDimension("overworld")
              .spawnParticle(
                lore[1],
                new Location(
                  block.location.x + 0.5,
                  block.location.y + 1.5,
                  block.location.z + 0.5
                ),
                new MolangVariableMap()
              );
          }
        }
        if (lore[0] == "Stopsound") {
          p.runCommand("stopsound @s");
          p.runCommand("music stop");
        }
      }
      /*===================================================*/

      /*================== ПВП -сек =================*/
      if (wo.Q("server:pvpmode:enable"))
        try {
          p.runCommand("scoreboard players remove @s[scores={pvp=1..}] pvp 1");
        } catch (e) {}
      /*===================================================*/

      /*================== Другие таймеры =================*/
      if (wo.Q("timer:enable")) {
        Allsec.Eadd(p, 1);
        if (Allsec.Eget(p) >= 60) {
          Allmin.Eadd(p, 1);
          Allsec.Eset(p, 0);
        }
        if (Allmin.Eget(p) >= 60) {
          Allhrs.Eadd(p, 1);
          Allmin.Eset(p, 0);
        }
        Daysec.Eadd(p, 1);
        if (Daysec.Eget(p) >= 60) {
          Daymin.Eadd(p, 1);
          Daysec.Eset(p, 0);
        }
        if (Daymin.Eget(p) >= 60) {
          Dayhrs.Eadd(p, 1);
          Daymin.Eset(p, 0);
        }
        Seasec.Eadd(p, 1);
        if (Seasec.Eget(p) >= 60) {
          Seamin.Eadd(p, 1);
          Seasec.Eset(p, 0);
        }
        if (Seamin.Eget(p) >= 60) {
          Seahrs.Eadd(p, 1);
          Seamin.Eset(p, 0);
        }
      }
      if (Number(wo.Q("perm:data")) != Math.floor(Date.now() / 84400000)) {
        wo.set("perm:data", Math.floor(Date.now() / 84400000));
        Dayhrs.reset();
        Daymin.reset();
        Daysec.reset();
        world.say("Days reseted");
      }
      try {
        p.runCommand(
          "scoreboard players remove @s[scores={lockedtitle=1..}] lockedtitle 1"
        );
      } catch (e) {}
    }
  },
  20,
  "server20"
);

/*
|--------------------------------------------------------------------------
* * Каждые две секунды
|--------------------------------------------------------------------------
|
| Звуки
| 
*/
SA.Utilities.time.setTickInterval(() => {
  //SA.Build.chat.runCommand('music stop')
  for (const p of world.getPlayers()) {
    if (SA.Build.entity.getHeldItem(p)?.typeId == "we:tool") {
      const lore = SA.Build.entity.getHeldItem(p).getLore();
      if (lore[0] == "Sound") {
        const s = {};
        //s.pitch = lore[2] ?? 0
        //s.volume = 4
        p.playSound(lore[1], s);
      }
    }
  }
}, 40);

/*
|--------------------------------------------------------------------------
? Команда
|--------------------------------------------------------------------------



new XA.Command(
  {
    name: "ы",
    description: "",
    tags: ["commands"],
  },
  (ctx) => {

  }
);


*/

new XA.Command(
  {
    name: "test",
    description: "",
    tags: ["commands"],
  },
  (ctx) => {
    const block = world
      .getDimension("overworld")
      .getBlock(
        SA.Build.entity
          .locationToBlockLocation(ctx.sender.location)
          .offset(0, -1, 0)
      );
    if (block.getComponent("inventory")?.container)
      return ctx.reply(
        stringifyEx(block.getComponent("inventory")?.container, " ") +
          "\n" +
          stringifyEx(block, " ")
      );
    ctx.reply("§cError");
  }
);

new XA.Command(
  {
    name: "db",
    description: "",
    tags: ["commands"],
  },
  (ctx) => {
    for (const key of Object.keys(SA.tables).filter((e) => e != "i")) {
      ctx.reply(key);
      const c = SA.tables[key].getCollection();
      const b = SA.Utilities.format.stringifyEx(c, " ");
      ctx.reply(b);
    }
  }
);

new XA.Command(
  {
    name: "time",
    description: "",
    tags: ["commands"],
  },
  (ctx) => {
    ctx.reply(shortTime());
  }
);

const casda = new XA.Command({
  name: "name",
  description: "",
  tags: ["commands"],
})
  .addOption("Name", "string")
  .executes((ctx) => {
    ctx.sender.nameTag = ctx.args.join("\n");
    console.warn(ctx.sender.name + " => " + ctx.sender.nameTag);
  });
casda.addSubCommand({ name: "reset", description: "Возвращает" }, (ctx) => {
  ctx.sender.nameTag = ctx.sender.name;
});

/*
|--------------------------------------------------------------------------
* * Активация режима пвп
|--------------------------------------------------------------------------
|
| 
| 
*/
world.events.entityHurt.subscribe((data) => {
  if (
    data.cause != "fire" &&
    data.cause != "fireworks" &&
    data.cause != "projectile"
  )
    return;
  if (
    data.hurtEntity.typeId == "t:hpper_minecart" ||
    !wo.Q("server:pvpmode:enable") ||
    SA.Build.entity.getTagStartsWith(data.hurtEntity, "lockpvp:")
  )
    return;
  let lastHit = false;
  // @ts-ignore
  if (data.damage >= data.hurtEntity.getComponent("minecraft:health").current)
    lastHit = true;
  if (data?.damagingEntity instanceof Player) {
    //Всякая фигня без порядка
    SA.Build.chat.runCommand(`scoreboard objectives add pvp dummy`);
    data.damagingEntity.runCommandAsync(
      `scoreboard players set @s pvp ${
        wo.Q("server:pvpmode:cooldown") ? wo.Q("server:pvpmode:cooldown") : 15
      }`
    );
    stats.Hgive.Eadd(data.damagingEntity, data.damage);
    if (lastHit) stats.kills.Eadd(data.damagingEntity, 1);

    //Если лук, визуализируем
    if (data.cause == "projectile" && wo.Q("server:bowhit")) {
      if (po.Q("pvp:bowhitsound", data.damagingEntity))
        data.damagingEntity.runCommandAsync(
          `playsound block.end_portal_frame.fill @s ~~~ 1 ${data.damage / 2}`
        );
      if (
        po.Q("pvp:bowhittitle", data.damagingEntity) &&
        data.hurtEntity instanceof Player
      ) {
        lastHit
          ? data.damagingEntity.onScreenDisplay.setActionBar(
              SA.Lang.lang["title.kill.bow"](data.hurtEntity.name)
            )
          : data.damagingEntity.onScreenDisplay.setActionBar(
              `§c-${data.damage}♥`
            );
        SA.Build.chat.runCommand(`scoreboard objectives add lockedtitle dummy`);
        data.damagingEntity.runCommandAsync(
          "scoreboard players set @s lockedtitle 2"
        );
      }
    }
    if (data.cause != "projectile" && lastHit && data.hurtEntity instanceof Player)
      data.damagingEntity.onScreenDisplay.setActionBar(
        SA.Lang.lang["title.kill.hit"](data.hurtEntity.name)
      );
  }
  if (data?.hurtEntity?.typeId != "minecraft:player") return;
  SA.Build.chat.runCommand(`scoreboard objectives add pvp dummy`);
  data.hurtEntity.runCommand(
    `scoreboard players set @s pvp ${
      wo.Q("server:pvpmode:cooldown") ? wo.Q("server:pvpmode:cooldown") : 15
    }`
  );
  stats.Hget.Eadd(data.hurtEntity, data.damage);
});

/*
|--------------------------------------------------------------------------
* * Событие использования предмета
|--------------------------------------------------------------------------
|
| 
| 
*/
world.events.beforeItemUse.subscribe((data) => {
  if (data.item.typeId == "we:tool" && data.source instanceof Player) {
    let item = data.item;
    let lore = item.getLore();
    if (lore && lore[0] == "Particle") {
      if (data.source.isSneaking) {
        if (Number(lore[2]) - 1 >= 0) {
          lore[1] = P[Number(lore[2]) - 1] ?? lore[1];
          lore[2] = String(Number(lore[2]) - 1);
          item.setLore(lore);
          data.source
            .getComponent("minecraft:inventory")
            // @ts-ignore
            .container.setItem(data.source.selectedSlot, item);
        }
      }
      if (!data.source.isSneaking) {
        if (Number(lore[2]) + 1 <= P.length) {
          lore[1] = P[Number(lore[2]) + 1] ?? lore[1];
          lore[2] = String(Number(lore[2]) + 1);
          item.setLore(lore);
          data.source
            .getComponent("minecraft:inventory")
            // @ts-ignore
            .container.setItem(data.source.selectedSlot, item);
        }
      }
    }
    if (lore && lore[0] == "Loot") {
      if (data.source.isSneaking) {
        if (Number(lore[1] ?? 1) - 1 >= 0) {
          // @ts-ignore
          lore[1] = String(lore[1] - 1);
          item.setLore(lore);
          data.source
            .getComponent("minecraft:inventory")
            // @ts-ignore
            .container.setItem(data.source.selectedSlot, item);
        }
      }
      if (!data.source.isSneaking) {
        if (Number(lore[1] ?? 0) + 1 <= P.length) {
          lore[1] = String(Number(lore[1]) + 1);
          item.setLore(lore);
          data.source
            .getComponent("minecraft:inventory")
            // @ts-ignore
            .container.setItem(data.source.selectedSlot, item);
        }
      }
    }
    if (lore && lore[0] == "Sound") {
      if (data.source.isSneaking) {
        if (Number(lore[2]) - 1 >= 0) {
          lore[1] = S[Number(lore[2]) - 1] ?? lore[1];
          lore[2] = String(Number(lore[2]) - 1);
          item.setLore(lore);
          data.source
            .getComponent("minecraft:inventory")
            // @ts-ignore
            .container.setItem(data.source.selectedSlot, item);
        }
      }
      if (!data.source.isSneaking) {
        lore[1] = S[Number(lore[2]) + 1] ?? lore[1];
        lore[2] = String(Number(lore[2]) + 1);
        item.setLore(lore);
        data.source
          .getComponent("minecraft:inventory")
          // @ts-ignore
          .container.setItem(data.source.selectedSlot, item);
      }
    }
    if (lore && lore[0] == "run") {
      SA.Build.chat.runCommand(lore[1]);
    }
    if (lore && lore[0] == "runE") {
      data.source.runCommand(lore[1]);
    }
    if (lore && lore[0] == "viewTP") {
      const block = data.source.getBlockFromViewVector(
        new BlockRaycastOptions()
      );
      if (block && block.location)
        data.source.teleport(
          new Location(block.location.x, block.location.y, block.location.z),
          world.getDimension("overworld"),
          data.source.rotation.x,
          data.source.rotation.y
        );
    }
  }
});
