// @ts-nocheck

import {
  Enchantment,
  EnchantmentList,
  Entity,
  InventoryComponentContainer,
  ItemStack,
  MinecraftEnchantmentTypes,
  MinecraftItemTypes,
  Player,
  PlayerInventoryComponentContainer,
  world,
} from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  MessageFormResponse,
  ModalFormData,
  ModalFormResponse,
} from "@minecraft/server-ui";
import { sleep, XA } from "xapi.js";
import {
  OPTIONS,
  po,
  wo,
  WORLDOPTIONS,
} from "../../../../../lib/Class/Options.js";
import { Wallet } from "../../../../../lib/Class/Wallet.js";
import { LeaderboardBuild } from "../../../../Leaderboards/LeaderboardBuilder.js";
import {
  Allhrs,
  Allmin,
  Allsec,
  Dayhrs,
  Daymin,
  Daysec,
  Seahrs,
  Seamin,
  Seasec,
} from "../../../../Server/index.js";
import { Atp } from "../../../../Server/portals.js";
import { stats } from "../../../../Server/private.js";
import { ENTITY_INVENTORY, GUI_ITEM } from "../../config.js";
import {
  auxa,
  DEFAULT_STATIC_PAGE_ID,
  pls,
  предметы,
} from "../../static_pages.js";
import {
  ChangeAction,
  ChangePAction,
  CloseAction,
  GiveAction,
  OpenForm,
  PageAction,
  SetAction,
} from "./ItemActions.js";
import { getItemUid, Page, PAGES } from "./Page.js";

//new WorldOption("js:stats", "включает статистику функций");
export function co(msg) {
  if (wo.Q("js:stats")) world.say(msg);
}

class DefaultFill {
  /**
   * Fills a entity with desired itmes
   * @param {Entity} entity
   * @param {Page} page page type to fill
   */
  static fill(entity, page) {
    /**
     * @type {InventoryComponentContainer}
     */
    const container = entity.getComponent("minecraft:inventory").container;

    for (let i = 0; i < container.size; i++) {
      const item = page.items[i];
      if (!item || !item.type) {
        entity.runCommand(`replaceitem entity @s slot.inventory ${i} air`);
        continue;
      }
      entity.runCommand(
        `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
      );
      /**
       * @type {ItemStack}
       */
      const chestItem = container.getItem(i);
      if (item?.name) chestItem.nameTag = item.name;
      if (item?.lore) chestItem.setLore(item.lore);
      if (item?.components?.enchantments?.length > 0) {
        const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
        /**
         * @type {EnchantmentList}
         */
        const ItemStackEnchantments =
          chestItem.getComponent("enchantments").enchantments;
        for (const ench of item.components.enchantments) {
          ItemStackEnchantments.addEnchantment(
            new Enchantment(
              MinecraftEnchantments.find((type) => type.id == ench.id),
              ench.level
            )
          );
        }
        chestItem.getComponent("enchantments").enchantments =
          ItemStackEnchantments;
      }
      container.setItem(i, chestItem);
    }
  }
}

/**
 * Fills a entity with desired itmes
 * @param {Entity} entity
 * @param {Page} page page type to fill
 */
function ShopFill(entity, page, player) {
  /**
   * @type {InventoryComponentContainer}
   */
  const container = entity.getComponent("minecraft:inventory").container;
  const id = page.id + "::dm::" + player.name;
  let custom_page;
  PAGES[id]
    ? (custom_page = PAGES[id])
    : (custom_page = new Page(id, 54, "shop"));
  for (let i = 0; i < container.size; i++) {
    /**
     * @type {import("./Page").Item}
     */
    let item = custom_page?.items[i] ?? page?.items[i];
    if (!item || !item.type) {
      container.setItem(i, new ItemStack(MinecraftItemTypes.air));
      continue;
    }
    if (item.lore[0] == XA.Lang.lang["shop.lore"]()[0]) {
      const w = new Wallet(player);

      item.lore = XA.Lang.lang["shop.lore"](
        XA.Lang.parse(item.lore, "shop.lore").price,
        w.balance()
      );
    }
    entity.runCommand(
      `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
    );
    /**
     * @type {ItemStack}
     */
    const chestItem = container.getItem(i);
    if (item?.name) chestItem.nameTag = item.name;
    if (item?.lore) chestItem.setLore(item.lore);
    if (item?.components?.enchantments?.length > 0) {
      const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
      /**
       * @type {EnchantmentList}
       */
      const ItemStackEnchantments =
        chestItem.getComponent("enchantments").enchantments;
      for (const ench of item.components.enchantments) {
        ItemStackEnchantments.addEnchantment(
          new Enchantment(
            MinecraftEnchantments.find((type) => type.id == ench.id),
            ench.level
          )
        );
      }
      chestItem.getComponent("enchantments").enchantments =
        ItemStackEnchantments;
    }
    container.setItem(i, chestItem);
    custom_page.createItem(
      i,
      item.type,
      item?.amount,
      item?.data,
      item?.action,
      item?.name,
      item?.lore
    );
    if (i == 0) co("crItem: " + item.type);
    //console.warn(iitem + ' ' + item.type)
  }
  co("Real type: " + custom_page.items[0].type);
  return custom_page;
}

//Настройки игрока и новая система - заполнение массивом (модер меню)
class SpecialFill {
  /**
   * Fills a entity with desired itmes
   * @param {Entity} entity
   * @param {Page} page page type to fill
   */
  static fill(entity, page, player) {
    /**
     * @type {InventoryComponentContainer}
     */
    const container = entity.getComponent("minecraft:inventory").container;
    const id = "forplayer:" + player.name;
    let custom_page;
    PAGES[id]
      ? (custom_page = PAGES[id])
      : (custom_page = new Page(id, 54, "spec"));
    for (let i = 0; i < container.size; i++) {
      /**
       * @type {import("./Page").Item}
       */
      let item = custom_page?.items[i] ?? page?.items[i];
      if (!item || !item.type) {
        container.setItem(i, new ItemStack(MinecraftItemTypes.air));
        continue;
      }
      let iitem;
      const opt = item.name.cc();
      if (item.type == "minecraft:white_candle" && po.E(opt)) {
        if (po.E(opt)?.Aitem) {
          iitem = po.E(opt)?.Aitem;
          po.Q(opt, player)
            ? item.components.ItemEnchantTypes.push({
                level: 1,
                id: MinecraftEnchantmentTypes.mending.id,
              })
            : "";
        } else {
          let vid = po.E(opt)?.exp ?? false;
          if (!vid) {
            iitem = `${po.Q(opt, player) ? "lime" : "red"}_candle`;
          } else iitem = `${po.Q(opt, player) ? "yellow" : "red"}_candle`;
        }
        entity.runCommand(
          `replaceitem entity @s slot.inventory ${i} ${iitem} ${item?.amount} ${item?.data}`
        );
      } else
        entity.runCommand(
          `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
        );
      /**
       * @type {ItemStack}
       */
      const chestItem = container.getItem(i);
      if (item?.name) chestItem.nameTag = item.name;
      if (item?.lore) chestItem.setLore(item.lore);
      if (item?.components?.enchantments?.length > 0) {
        const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
        /**
         * @type {EnchantmentList}
         */
        const ItemStackEnchantments =
          chestItem.getComponent("enchantments").enchantments;
        for (const ench of item.components.enchantments) {
          ItemStackEnchantments.addEnchantment(
            new Enchantment(
              MinecraftEnchantments.find((type) => type.id == ench.id),
              ench.level
            )
          );
        }
        chestItem.getComponent("enchantments").enchantments =
          ItemStackEnchantments;
      }
      let it;
      iitem ? (it = iitem) : (it = item.type);
      container.setItem(i, chestItem);
      custom_page.createItem(
        i,
        it,
        item?.amount,
        item?.data,
        item?.action,
        item?.name,
        item?.lore
      );
      if (i == 0) co("crItem: " + item.type);
      //console.warn(iitem + ' ' + item.type)
    }
    co("Real type: " + custom_page.items[0].type);
    return custom_page;
  }
  /**
   * Fills a entity with desired itmes
   * @param {Entity} entity
   * @param {Page} page page type to fill
   */
  static FillArray(
    entity,
    page,
    player,
    array,
    arrayType,
    customItem1 = "minecraft:name_tag",
    item1ac = "set",
    customItem2 = "minecraft:name_tag",
    item2ac = "set"
  ) {
    /**
     * @type {InventoryComponentContainer}
     */
    const container = entity.getComponent("minecraft:inventory").container;
    const id = "forrplayer:" + player.name;
    let custom_page;
    PAGES[id]
      ? (custom_page = PAGES[id])
      : (custom_page = new Page(id, 54, "array:" + arrayType));
    for (let i = 0; i < container.size; i++) {
      /**
       * @type {import("./Page").Item}
       */
      let item = custom_page?.items[i] ?? page?.items[i];
      if (i <= 44 && array[i]) {
        const ttype = Number(array[i].split("(::)")[0]);
        item = {};
        item.name = array[i].startsWith("§m§n§m§r")
          ? array[i].split("(::)")[1]
          : "§m§n§m§r" + array[i].split("(::)")[1];
        item.action = ttype == 2 ? item2ac : item1ac;
        item.amount = i + 1;
        item.data = 0;
        item.type = ttype == 2 ? customItem2 : customItem1;
      }
      if (!item || !item.type) {
        container.setItem(i, new ItemStack(MinecraftItemTypes.air));
        continue;
      }
      entity.runCommand(
        `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
      );
      /**
       * @type {ItemStack}
       */
      const chestItem = container.getItem(i);
      if (item?.name) chestItem.nameTag = item.name;
      if (item?.lore) chestItem.setLore(item.lore);
      container.setItem(i, chestItem);
      custom_page.createItem(
        i,
        item.type,
        item?.amount,
        item?.data,
        item?.action,
        item?.name,
        item?.lore
      );

      //console.warn(iitem + ' ' + item.type)
    }
    return custom_page;
  }
}
//Меню игроков в админ меню
class PlayerFill {
  /**
   * Fills a entity with desired itmes
   * @param {Entity} entity
   * @param {Page} page page type to fill
   */
  static fill(entity, page, action = "openPlayerMenu") {
    /**
     * @type {InventoryComponentContainer}
     */
    const container = entity.getComponent("minecraft:inventory").container;
    let players = [];
    for (const p of world.getPlayers()) {
      players.push(p.name);
    }
    for (let i = 0; i < container.size; i++) {
      /**
       * @type {import("./Page").Item}
       */
      let item = page?.items[i];
      if (i < players.length) {
        const lvl = XA.Entity.getScore(XA.Entity.fetch(players[i]), "perm");
        let color, id;
        if (lvl == 2) (color = "6"), (id = "ender_chest");
        if (lvl == 1) (color = "9"), (id = "barrel");
        if (!color) (color = "f"), (id = "chest");
        item = {};
        item.action = action;
        item.amount = i + 1;
        item.data = 3;
        item.lore = ["", "§r§7Нажми что бы открыть меню"];
        item.name = "§r§" + color + players[i];
        item.n = players[i];
        item.type = "minecraft:" + id;
      }
      if (!item || !item.type) {
        container.setItem(i, new ItemStack(MinecraftItemTypes.air));
        continue;
      }
      entity.runCommand(
        `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
      );
      /**
       * @type {ItemStack}
       */
      const chestItem = container.getItem(i);
      if (item?.name) chestItem.name = item.n;
      if (item?.name) chestItem.nameTag = item.name;
      if (item?.lore) chestItem.setLore(item.lore);
      if (item?.components?.enchantments?.length > 0) {
        const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
        /**
         * @type {EnchantmentList}
         */
        const ItemStackEnchantments =
          chestItem.getComponent("enchantments").enchantments;
        for (const ench of item.components.enchantments) {
          ItemStackEnchantments.addEnchantment(
            new Enchantment(
              MinecraftEnchantments.find((type) => type.id == ench.id),
              ench.level
            )
          );
        }
        chestItem.getComponent("enchantments").enchantments =
          ItemStackEnchantments;
      }
      container.setItem(i, chestItem);
      pls.createItem(
        i,
        item.type,
        item?.amount,
        item?.data,
        item?.action,
        item?.name,
        item?.lore
      );
    }
  }
}
//Нерабочая фигня
class Itemss {
  /**
   *
   * @param {Entity} entity
   * @param {Page} page page type to fill
   */
  static fill(entity, itema = null) {
    if (itema) {
      XA.OLDDB.i.add(itema);
      console.warn(itema.id);
    }
    /**
     * @type {InventoryComponentContainer}
     */
    const container = entity.getComponent("minecraft:inventory").container;
    let items = XA.OLDDB.i.items();
    for (let i = 0; i < container.size; i++) {
      let im;
      /**
       * @type {import("./Page").Item}
       */
      let item = предметы.items[i];
      if (i < items.length) {
        im = items[i];
        item = {};
        item.action = "give2";
        item.amount = im.amount;
        item.data = im.amount;
        item.lore = im.getLore();
        item.name = im.nameTag;
        item.type = im.typeId;
      }
      if (!item || !item.type) {
        container.setItem(i, new ItemStack(MinecraftItemTypes.air));
        continue;
      }
      if (!im) {
        entity.runCommand(
          `replaceitem entity @s slot.inventory ${i} ${item?.type} ${item?.amount} ${item?.data}`
        );
      } else {
        container.setItem(i, im);
        continue;
      }
      /**
       * @type {ItemStack}
       */
      const chestItem = container.getItem(i);
      if (item?.name) chestItem.name = item.name;
      if (item?.lore) chestItem.setLore(item.lore);
      container.setItem(i, chestItem);
      предметы.createItem(
        i,
        item.type,
        item?.amount,
        item?.data,
        item?.action,
        item?.name,
        item?.lore
      );
    }
  }
}

/**
 * @typedef {Object} MappedInventoryItem a inventory that has been saved
 * @property {String} uid a unique id for a itemStack
 * @property {ItemStack} item the item
 */

/**
 * @typedef {Object} SlotChangeReturn What gets return on a slot change
 * @property {Number} slot Slot that changed
 * @property {ItemStack} item the item that was grabbed
 */

/**
 * This is a object showing players chestGUI to entity
 * @type {Object<string, ChestGUI>}
 */
export const CURRENT_GUIS = {};

export const ACTIONS1 = {
  temp: (his, item) => {
    console.warn("lol, temp runned");
  },

  openPlayerMenu: (his, item) => {
    const form = new ModalFormData();
    form.title("§l§f" + item.name.cc() + "§r");
    //form.textField('Введи значение:', 'значение', wo.Q(item.name.cc()) ? wo.Q(item.name.cc()) : undefined)
    form.dropdown(
      "Уровень разрешений:",
      [
        "Участник",
        "§9Модер§r (команды, OP)",
        "§6Админ§r (команды, OP, настройки)",
      ],
      XA.Entity.getScore(XA.Entity.fetch(item.name.cc()), "perm")
    );
    OpenForm(his, his.player, form, (res) => {
      if (!res.isCanceled) {
        switch (res.formValues[0]) {
          case 0:
            /**
             * @type {Array<String>}
             */
            let list1 = wo.Q("perm:владельцы").split(", ");
            let list2 = wo.Q("perm:модеры").split(", ");
            let list11 = [];
            let list22 = [];
            list1.forEach((e) => {
              if (e != item.name.cc()) list11.push(e);
            });
            list2.forEach((e) => {
              if (e != item.name.cc()) list22.push(e);
            });
            wo.set("perm:владельцы", list11.join(", "));
            wo.set("perm:модеры", list22.join(", "));
            world.say(`► ${item.name.cc()} теперь обычный игрок`);
            break;
          case 1:
            let ist1 = wo.Q("perm:владельцы").split(", ");
            let ist2 = wo.Q("perm:модеры").split(", ");
            ist2.push(item.name.cc());
            let ist11 = [];
            ist1.forEach((e) => {
              if (e != item.name.cc()) ist11.push(e);
            });
            wo.set("perm:владельцы", ist11.join(", "));
            wo.set("perm:модеры", ist2.join(", "));
            world.say(`§9►§f ${item.name.cc()} назначен §9Модером`);
            break;
          case 2:
            let st1 = wo.Q("perm:владельцы").split(", ");

            st1.push(item.name.cc());

            let st2 = wo.Q("perm:модеры").split(", ");

            let st22 = [];

            st2.forEach((e) => {
              if (e != item.name.cc()) st22.push(e);
            });

            wo.set("perm:владельцы", st1.join(", "));

            wo.set("perm:модеры", st22.join(", "));

            world.say(`§6►§f ${item.name.cc()} назначен §6Админом§r`);
            break;
        }
      }
      world.say(res.formValues);
    });
  },
  open: (his, item) => {
    const form = new ModalFormData();
    form.title("§l§f" + item.name.cc() + "§r");
    form.textField(
      "Введи значение:",
      "значение",
      wo.Q(item.name.cc()) ? wo.Q(item.name.cc()) : undefined
    );
    OpenForm(his, his.player, form, (res) => {
      if (!res.isCanceled) {
        wo.set(item.name.cc(), res.formValues[0]);
        world.say(res.formValues[0]);
      }
    });
  },
  give2: (his, item) => {
    console.warn("give2");
    const form = new ActionFormData();
    form.button("Удалить");
    form.button("Оставить");
    form.body("Удалить предмет из базы данных после сбора?");
    form.title("Ответь");
    OpenForm(his, his.player, form, (res) => {
      if (!res.isCanceled) {
        console.warn(res.formValues[0]);
      }
    });
  },

  give: (his, item) => GiveAction(his, item),
  lbs: (his, item) => {
    const form = new ModalFormData();
    form.title("§l§fСтиль§r");
    form.textField("Оставь пустым для удаления", "gray | orange | green", "");
    OpenForm(his, his.player, form, (data) => {
      if (data.isCanceled) return;
      const ent = XA.Entity.getClosetsEntitys(
        his.player,
        10,
        "f:t",
        44,
        false
      ).find(
        (e) =>
          e.nameTag == item.name.replace("§m§n§m§r", "").replace("§m§n§m§r", "")
      );
      if (!data.formValues[0]) {
        LeaderboardBuild.removeObj(XA.Entity.getTagStartsWith(ent, "obj:"));
        ent.triggerEvent("kill");
        return;
      }
      LeaderboardBuild.shangeStyle(
        XA.Entity.getTagStartsWith(ent, "obj:"),
        data.formValues[0]
      );
    });
  },
  tag: (his, item) => {
    his.player.removeTag(item.name.cc());
  },
  redo: (his, item) => {
    const form = new ModalFormData();
    form.title("§l§fРедактирование§r");
    form.textField(
      "Оставь пустым для удаления",
      "Имя",
      item.name.replace("§m§n§m§r§m§n§m§r", "")
    );
    OpenForm(his, his.player, form, (d) => {
      /**
       * @type {ModalFormResponse}
       */
      const data = d;
      if (data.isCanceled) return;
      const ent = XA.Entity.getClosetsEntitys(
        his.player,
        10,
        "f:t",
        44,
        false
      ).find((e) => e.nameTag.cc() == item.name.cc());
      if (!data.formValues[0]) ent.triggerEvent("kill");
      ent.nameTag = data.formValues[0];
    });
  },
  "spawn:ft": (his, item) => {
    const form = new ModalFormData();
    form.title("§l§fЛетающий текст§r");
    form.textField("Имя", "Оставь пустым для отмены", "§");
    OpenForm(his, his.player, form, (data) => {
      if (data.isCanceled || !data.formValues[0]) return;
      const ent = his.player.dimension.spawnEntity(
        "f:t",
        XA.Entity.locationToBlockLocation(his.player.location)
      );
      ent.nameTag = data.formValues[0];
    });
  },
  "spawn:lb": (his, item) => {
    const form = new ModalFormData();
    form.title("§l§fЛидерборд§r");
    form.textField("Таблица счета", "Оставь пустым для отмены", "");
    form.textField("Стиль", "gray | orange | green", "");
    OpenForm(his, his.player, form, (data) => {
      if (data.isCanceled || !data.formValues[0] || !data.formValues[1]) return;
      const l = XA.Entity.locationToBlockLocation(his.player.location);
      world.say(
        LeaderboardBuild.createLeaderboard(
          data.formValues[0],
          l.x,
          l.y,
          l.z,
          his.player.dimension.id,
          data.formValues[1]
        ),
        his.player.name
      );
    });
  },
  close: (his, item) => {
    CloseAction(his);
  },
  set: (his, item, change) => {
    SetAction(his, item, change.slot, change.item);
  },
  change: (his, item, change) => {
    ChangePAction(his, item, change.slot, his.player);
  },
  "sc:clear": (his, item, change) => {
    for (const opt of OPTIONS) {
      his.player.removeTag(opt.name);
    }
    let count = 0;
    for (let item of his.mapInventory) {
      let nei = {
        lore: item.item.getLore(),
        name: item.item.nameTag,
      };
      SetAction(
        his,
        nei,
        count,
        new ItemStack(
          MinecraftItemTypes.redCandle,
          item.item.amount,
          item.item.data
        )
      );
      PAGES[his.page.id].createItem(
        count,
        "minecraft:red_candle",
        item.item.amount,
        item.item.data,
        "change",
        item.item.nameTag,
        item.item.getLore()
      );
      count++;
      if (count >= OPTIONS.length) break;
    }
    SetAction(his, item, change.slot, change.item);
  },
  stats: (his, item) => {
    const form = new ActionFormData();
    form.title("§l§fСтатистика " + his.player.name + "§r");
    form.button("Закрыть");
    form.body(
      // `Время всего: ${}:${}:${}\nВремя за на анархии: ${}:${Seamin.Eget(his.player)}:${Seasec.Eget(
      //   his.player
      // )}\nВремя за день: ${Dayhrs.Eget(his.player)}:${Daymin.Eget(
      //   his.player
      // )}:${Daysec.Eget(his.player)}${"\n\n\n\n"}`
      XA.Lang.lang.stats(
        Allhrs.Eget(his.player),
        Allmin.Eget(his.player),
        Allsec.Eget(his.player),
        Seahrs.Eget(his.player),
        Seamin.Eget(his.player),
        Seasec.Eget(his.player),
        Dayhrs.Eget(his.player),
        Daymin.Eget(his.player),
        Daysec.Eget(his.player),
        stats.kills.Eget(his.player),
        stats.deaths.Eget(his.player),
        stats.Hget.Eget(his.player),
        stats.Hgive.Eget(his.player),
        stats.Bplace.Eget(his.player),
        stats.Bbreak.Eget(his.player),
        stats.FVlaunc.Eget(his.player)
      )
    );
    OpenForm(his, his.player, form);
  },
};

const STARTACTIONS1 = {
  "": (his, item) => {
    let a = item.action.split(":")[1];
    if (a == "clear") {
      wo.reset();
      let count = 0;
      for (let item of his.mapInventory) {
        if (wo.E(item.item.nameTag.cc()).text) {
          count++;
          if (count >= WORLDOPTIONS.length) break;
          continue;
        }
        let nei = {
          lore: item.item.getLore(),
          name: item.item.nameTag,
        };
        SetAction(
          his,
          nei,
          count,
          new ItemStack(
            MinecraftItemTypes.redCandle,
            item.item.amount,
            item.item.data
          )
        );
        auxa.createItem(
          count,
          "minecraft:red_candle",
          item.item.amount,
          item.item.data,
          "change",
          item.item.nameTag,
          item.item.getLore()
        );
        count++;
        if (count >= WORLDOPTIONS.length) break;
      }
    }
    if (a == "clear0") wo.reset0();
    SetAction(his, item, slot, itemStack);
  },

  "sc:": (his, item) => {
    console.warn("lol, empty runned");
  },
  "change:": (his, item, slot) => {
    ChangeAction(his, item, slot);
  },
  /**
   *
   * @param {ChestGUI} his
   * @param {import("./Page.js").Item} item
   */
  "buy:": (his, item) => {
    const price = Number(item.action.split(":")[1]),
      form = new MessageFormData(),
      w = new Wallet(his.player);
    if (w.balance() < price) {
      world.say(
        XA.Lang.lang["shop.notenought"](price, w.balance()),
        his.player.name
      );
      his.player.playSound("note.bass");
      his.setPage(his.page.id);
      return;
    }
    form.title("§l§fПокупка§r");
    form.body(
      `  §7Вы уверены, что хотите купить §f${item.type.split(":")[1]} х${
        item.amount
      } §7за§6 ${price}?\n  §7Ваш баланс сейчас: §6${w.balance()}§7, после покупки на нем станет: §f${
        w.balance() - price
      }`
    );
    form.button1("Купить");
    form.button2("§cОтмена§r");
    OpenForm(his, his.player, form, (d) => {
      /**
       * @type {MessageFormResponse}
       */
      const data = d;
      if (data.isCanceled || data.selection == 0) return;
      if (w.balance() < price) {
        world.say(
          XA.Lang.lang["shop.notenought"](price, w.balance()),
          his.player.name
        );
        his.player.playSound("note.bass");
        return;
      }
      GiveAction(his, item);
      w.add(-price);
      world.say(
        XA.Lang.lang["shop.suc"](
          item.type.split(":")[1],
          item.amount,
          price,
          w.balance()
        ),
        his.player.name
      );
      his.player.playSound("random.levelup");
    });
  },
  "page:": (his, item) => PageAction(his, item),
  "Atp:": (his, item, change) => {
    SetAction(his, item, change.slot, change.item);
    his.killa().then(() => Atp(his.player, item.action.split(":")[1]));
  },
};

export class ChestGUI {
  /**
   * Gets a inventory's coresponding gui
   * @param {Entity | null} entity entity to get not PLAYER
   */
  static getEntitysGuiInstance(entity) {
    return Object.values(CURRENT_GUIS).find((gui) => gui.entity == entity);
  }
  /**
   * Finds and returns a slot change in a inventory
   * @param {Array<MappedInventoryItem>} oldInv
   * @param {Array<MappedInventoryItem>} newInv
   * @returns {SlotChangeReturn | null}
   */
  static getSlotChange(oldInv, newInv) {
    if (oldInv.length != newInv.length) return null;
    for (let i = 0; i < oldInv.length; i++) {
      if (
        oldInv[i].uid != newInv[i].uid &&
        oldInv[i].item?.typeId == newInv[i].item?.typeId &&
        oldInv[i].item?.nameTag == newInv[i].item?.nameTag &&
        oldInv[i].item?.data == newInv[i].item?.data //&&
        //oldInv[i].item.getLore() == newInv[i].item.getLore()
      ) {
        oldInv[i].item.amount = oldInv[i].item.amount - newInv[i].item.amount;
        return { slot: i, item: oldInv[i].item, ex: true };
      }

      if (oldInv[i].uid != newInv[i].uid)
        return { slot: i, item: oldInv[i].item };
    }
    return null;
  }

  /**
   * Creates a new chestGUI and assigns it to a player
   * @param {Player} player the player this chestGUI is asigned to
   * @param {Entity} entity entity to use if undefined will create one
   */
  constructor(
    player,
    entity = null,
    GUIitem = null,
    GUIid = null,
    GUIpage = null
  ) {
    this.player = player;
    this.entity = entity;
    this.previousMap = null;
    this.id = GUIid ?? "id";
    this.p = GUIpage ?? DEFAULT_STATIC_PAGE_ID;
    /**
     * @type {Page}
     */
    this.page = null;

    if (!this.entity) this.summon();

    this.events = {
      tick: world.events.tick.subscribe(() => {
        try {
          if (this.entity.getComponent("minecraft:health").current <= 0)
            return this.kill();
        } catch (error) {
          this.kill();
        }
        if (GUIitem && GUIitem != "other") {
          if (XA.Entity.getHeldItem(this.player)?.typeId != GUIitem)
            return this.kill();
        } else if (
          GUIitem != "other" &&
          XA.Entity.getHeldItem(this.player)?.typeId != GUI_ITEM
        )
          return this.kill();

        try {
          this.entity.teleport(
            this.player.location,
            this.player.dimension,
            0,
            0
          );
        } catch (error) {}

        if (!this.player.hasTag(`has_container_open`)) return;
        if (!this.previousMap) return;

        const change = ChestGUI.getSlotChange(
          this.previousMap,
          this.mapInventory
        );
        if (change == null) return;
        this.onSlotChange(change, change.ex ? change.item.amount : "");
      }),
      playerLeave: world.events.playerLeave.subscribe(({ playerName }) => {
        if (playerName != this.player.name) return;
        this.kill();
      }),
    };

    CURRENT_GUIS[this.player.name] = this;
  }

  /**
   * This spawns a chest GUI entity and sets the this.entity
   */
  summon() {
    XA.Entity.world
      .getEntitys(ENTITY_INVENTORY)
      ?.find((e) => e.getTags().includes(`${this.id}:${this.player.name}`))
      ?.triggerEvent("despawn");
    let e = world.events.entityCreate.subscribe((data) => {
      if (data.entity.typeId == ENTITY_INVENTORY) {
        this.entity = data.entity;
        this.entity.addTag(`${this.id}:${this.player.name}`);
        this.entity.addTag(`gui`);
        this.setPage(this.p);
      }
      world.events.entityCreate.unsubscribe(e);
    });
    this.player.triggerEvent("smelly:spawn_inventory");
  }

  /**
   * Kills this chestGUI and removes all events
   */
  kill(data = null) {
    if (data) console.warn(data);
    let suc = false;
    try {
      for (const key in this.events) {
        world.events[key].unsubscribe(this.events[key]);
      }
      delete CURRENT_GUIS[this.player.name];
      delete PAGES["forplayer:" + this.player.name];
      delete PAGES["forrplayer:" + this.player.name];
      const k = Object.keys(PAGES).find((e) =>
        e.endsWith("::dm::" + this.player.name)
      );
      if (k) delete PAGES[k];
      try {
        this.entity.triggerEvent("despawn");
        suc = true;
      } catch (e) {}
    } catch (error) {
      console.warn(error + error.stack);
    }
    return suc;
  }
  /**
   * Kills this chestGUI and removes all events
   */
  async killa() {
    let suc = false;
    try {
      for (const key in this.events) {
        world.events[key].unsubscribe(this.events[key]);
      }
      delete CURRENT_GUIS[this.player.name];
      if (CURRENT_GUIS[this.player.name]) console.warn("wtf is going on");
      delete PAGES["forplayer:" + this.player.name];
      delete PAGES["forrplayer:" + this.player.name];
      try {
        this.entity.triggerEvent("despawn");
        suc = true;
      } catch (e) {}
    } catch (error) {
      console.warn(error + error.stack);
    }
    await sleep(10);
    return suc;
  }
  /**
   * Sets a container to specific page
   * @param {number | string} id page of const PAGES
   */
  setPage(id, extras = null) {
    /**
     * @type {Page}
     */
    let page = PAGES[id];

    if (!page || page.items.length < 1) {
      return console.warn("Страницы " + id + " нет");
    }
    if (page.fillType == "default") {
      DefaultFill.fill(this.entity, page);
    }
    if (page.fillType == "spec") {
      page = SpecialFill.fill(this.entity, page, this.player);
    }
    if (page.fillType == "shop") {
      page = ShopFill(this.entity, page, this.player);
    }
    if (page.fillType.startsWith("array:")) {
      if (page.fillType.split(":")[1] == "tags")
        page = SpecialFill.FillArray(
          this.entity,
          page,
          this.player,
          this.player
            .getTags()
            .filter((e) => !po.E(e))
            .map((e) => "1(::)" + e),
          "tags",
          null,
          "tag"
        );
      if (page.fillType.split(":")[1] == "text")
        page = SpecialFill.FillArray(
          this.entity,
          page,
          this.player,
          XA.Entity.getClosetsEntitys(this.player, 10, "f:t", 44, false).map(
            (e) => (e.hasTag("lb") ? "2(::)" + e.nameTag : "1(::)" + e.nameTag)
          ),
          "text",
          "minecraft:writable_book",
          "redo",
          "minecraft:gold_block",
          "set"
        );
      if (page.fillType.split(":")[1] == "lbs")
        page = SpecialFill.FillArray(
          this.entity,
          page,
          this.player,
          XA.Entity.getClosetsEntitys(this.player, 10, "f:t", 44, false)
            .filter((e) => e.hasTag("lb"))
            .map((e) => "1(::)" + e.nameTag),
          "text",
          "minecraft:gold_block",
          "lbs"
        );
    }

    if (page.fillType == "players") {
      PlayerFill.fill(this.entity, page);
    }
    if (page.fillType == "items") {
      Itemss.fill(this.entity, extras);
    }

    this.page = page;
    this.previousMap = this.mapInventory;
    this.entity.nameTag = `size:${page.size}` ?? "size:27";
  }

  /**
   * Gets a entitys inventory but with mapped data
   * @returns {Array<MappedInventoryItem>}
   */
  get mapInventory() {
    let container = this.entity.getComponent("inventory").container;
    let inventory = [];

    for (let i = 0; i < container.size; i++) {
      let currentItem = container.getItem(i);

      inventory.push({
        uid: getItemUid(currentItem),
        item: currentItem,
      });
    }

    this.previousMap = inventory;
    return inventory;
  }

  /**
   * This runs when a slot gets changed in the chest inventory
   * @param {SlotChangeReturn} change slot that was changed
   */
  onSlotChange(change, ex) {
    /**
     * The guiItem that was changed
     * @type {import("./Page.js").Item}
     */
    const item = this.page.items[change.slot];
    if (!item) {
      // item was added to page
      /**
       * @type {InventoryComponentContainer}
       */
      this.setPage(
        this.page.id == "lich"
          ? PAGES["forplayer:" + this.player] ?? this.page.id
          : this.page.id,
        item
      );
    } else {
      // item was taken from this page
      const clearItem = Object.assign(item);
      if (ex) clearItem.amount = ex;
      clearPlayersPointer(this.player, clearItem);

      if (!change.item && !getItemAtSlot(this.entity, change.slot)) return;

      // Действия
      let act = (_his, item) =>
        world.say("§c[ChestGUI] §fUnknown action: §r" + item.action);

      if (ACTIONS1[item.action]) act = ACTIONS1[item.action];
      for (const key of Object.keys(STARTACTIONS1)) {
        if (!item.action.startsWith(key)) continue;
        act = STARTACTIONS1[key];
      }

      safeRun(`ItemAction{${item.action}}`, () => act(this, item, change));
    }

    this.previousMap = this.mapInventory;
  }
}

export function safeRun(runnerName, callback) {
  try {
    const result = callback();
    if (result?.catch)
      result.catch((e) => {
        console.warn(`Promise ${runnerName} error: ${e.stack}`);
      });
    return true;
  } catch (error) {
    console.warn(`${runnerName} error: ${e.stack}`);
    return false;
  }
}

/**
 * Clears the player of a item in there pointer slot
 * @param {Player} player
 * @param {Item} ItemToClear
 */
export async function clearPlayersPointer(player, ItemToClear) {
  try {
    /**
     * @type {PlayerInventoryComponentContainer}
     */
    const inventory = player.getComponent("minecraft:inventory").container;
    let itemsToLoad = [];
    for (let i = 0; i < inventory.size; i++) {
      const item = inventory.getItem(i);
      if (!item) continue;
      if (item?.typeId == ItemToClear?.id) {
        itemsToLoad.push({ slot: i, item: item });
        inventory.setItem;
        if (i < 9) {
          player.runCommand(`replaceitem entity @s slot.hotbar ${i} air`);
        } else {
          player.runCommand(
            `replaceitem entity @s slot.inventory ${i - 9} air`
          );
        }
      }
    }
    try {
      player.runCommand(
        `clear @s ${ItemToClear?.id ?? ItemToClear?.type} ${ItemToClear.data} ${
          ItemToClear.amount
        }`
      );
    } catch (e) {
      // the item couldnt be cleared that means
      // they now have a item witch is really BAD
      [
        ...player.dimension.getEntities({
          type: "minecraft:item",
          location: player.location,
          maxDistance: 2,
          closest: 1,
        }),
      ][0]?.kill();
    }
    for (const item of itemsToLoad) {
      inventory.setItem(item.slot, item.item);
    }
  } catch (error) {
    console.warn(error + error.stack);
  }
}

/**
 * Gets a item at slot
 * @param {Entity} entity entity to grab from
 * @param {number} slot slot number to get
 * @returns {ItemStack | null}
 */
export function getItemAtSlot(entity, slot) {
  /**
   * @type {InventoryComponentContainer}
   */
  const inventory = entity.getComponent("minecraft:inventory").container;
  return inventory.getItem(slot);
}
