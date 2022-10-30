import {
  ItemStack,
  Items,
  MinecraftEnchantmentTypes,
  Enchantment,
  InventoryComponentContainer,
  world,
  ItemType,
} from "@minecraft/server";
import { po, wo } from "../../../../../app/Models/Options.js";
import { SA } from "../../../../../index.js";
import { XA } from "xapi.js";
import { ChestGUI } from "./ChestGUI.js";
import { auxa, lich } from "../../static_pages.js";
import { PAGES } from "./Page.js";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
//import { ActionFormData, MessageFormData, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";

/**
 * Gives the player the item the grabbed
 * @param {ChestGUI} chestGUI chest gui used
 * @param {import("./Page.js").Item} Item item that was grabbed
 */
export function GiveAction(chestGUI, Item) {
  let itemStack = new ItemStack(Items.get(Item.type), Item.amount, Item.data);
  if (Item?.components?.enchantments?.length > 0) {
    const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
    const ItemStackEnchantments =
      itemStack.getComponent("enchantments").enchantments;
    for (const ench of Item.components.enchantments) {
      ItemStackEnchantments.addEnchantment(
        new Enchantment(
          MinecraftEnchantments.find((type) => type.id == ench.id),
          ench.level
        )
      );
    }
    itemStack.getComponent("enchantments").enchantments = ItemStackEnchantments;
  }
  itemStack.nameTag = Item.name;
  chestGUI.player
    .getComponent("minecraft:inventory")
    .container.addItem(itemStack);
}

/**
 * Changes the page of the chestGui when this item is grabbed
 * @param {ChestGUI} chestGUI chest gui used
 * @param {import("./Page.js").Item} Item item that was grabbed
 */
export function PageAction(chestGUI, Item) {
  const pageTo = Item.action.replace("page:", "");
  chestGUI.setPage(pageTo);
}

/**
 * Closes the chect GUI when this item is grabbed
 * @param {ChestGUI} chestGUI chest gui used
 */
export function CloseAction(chestGUI) {
  chestGUI.kill();
}

/**
 * Runs a command on the player when this item is grabbed
 * @param {ChestGUI} chestGUI chest gui used
 * @param {import("./Page.js").Item} Item item that was grabbed
 */
export function CommandAction(chestGUI, Item) {
  const command = Item.action.split("command:")?.[1];
  try {
    chestGUI.player.runCommand(command);
  } catch (error) {}
}

/**
 * Runs a command on the player when this item is grabbed
 * @param {ChestGUI} chestGUI chest gui used
 * @param {import("./Page.js").Item} Item item that was grabbed
 */
export function ChangeAction(chestGUI, Item, slot) {
  const ret = wo.change(SA.Utilities.format.clearColors(Item.name));

  let id = "";
  if (ret[0] == "added") id = Item.action.split(":")[1];
  if (ret[0] == "removed") id = Item.action.split(":")[2];

  auxa.createItem(
    slot,
    id,
    Item.amount,
    Item.data,
    Item.action,
    Item.name,
    Item.lore
  );
  chestGUI.setPage("worldsett");
}

export function ChangePAction(chestGUI, Item, slot, player) {
  const ret = po.change(SA.Utilities.format.clearColors(Item.name), player);
  let id = ret[1]?.Aitem ?? "";
  let vid = ret[1]?.exp ?? false;
  let ench = {};
  if (!ret[1].Aitem) {
    if (ret[0] == "added" && !vid) id = "minecraft:lime_candle";
    if (ret[0] == "added" && vid) id = "minecraft:yellow_candle";
    if (ret[0] == "removed") id = "minecraft:red_candle";
  } else {
    if (ret[0] == "added") {
      ench.id = "mending";
      ench.lvl = 1;
    }
    if (ret[0] == "removed") {
      ench.id = "";
      ench.lvl = 0;
    }
  }
  let ppage = "";
  const iid = "forplayer:" + player.name;
  PAGES[iid] ? (ppage = PAGES[iid]) : (ppage = lich);
  ppage.createItem(
    slot,
    id,
    Item.amount,
    Item.data,
    Item.action,
    Item.name,
    Item.lore,
    [ench]
  );
  chestGUI.setPage(ppage.id);
}

/**
 *
 * @param {*} chestGUI
 * @param {*} player
 * @param {ModalFormData} form
 * @param {Function<ModalFormResponse>} callback
 */
export function OpenForm(chestGUI, player, form, callback) {
  chestGUI.kill();
  SA.Utilities.time.setTickTimeout(() => {
    form.show(player).then((res) => {
      return callback ? callback(res) : null;
    });
    // const c = new ModalFormData()
    // c.show().then(ModalFormResponse => {
    //   ModalFormResponse.isCanceled
    //   ModalFormResponse.formValues
    // })
  }, 5);
}

/**
 * Sets the item back
 * @param {ChestGUI} chestGUI chest gui used
 * @param {import("./Page.js").Item} Item item that was grabbed
 * @param {Number} slot slot that was changed
 * @param {ItemStack} itemStack itemStack that was changed
 */
export function SetAction(chestGUI, Item, slot, itemStack) {
  /**
   * @type {InventoryComponentContainer}
   */
  const it = itemStack;
  if (Item.lore) it.setLore(Item.lore);
  if (Item.name) it.nameTag = Item.name;
  const container = chestGUI.entity.getComponent(
    "minecraft:inventory"
  ).container;
  container.setItem(slot, it);
}
