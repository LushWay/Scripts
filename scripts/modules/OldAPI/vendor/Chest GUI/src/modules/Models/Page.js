import {
  Enchantment,
  Items,
  ItemStack,
  MinecraftEnchantmentTypes,
} from "@minecraft/server";
import { co } from "./ChestGUI";

/**
 * @typedef {Object} Item a gui item
 * @property {String} uid The unique id of this item
 * @property {String} type use Items.get() to get this item
 * @property {number} amount the ammount of items are in this stack
 * @property {number} data the data value of this stack
 * @property {string} name the name of this item
 * @property {Array<string>} lore lore of the item
 * @property {Object} components lore of the item
 * @property {string} action the action you want to run when the item is taken {"give", "function:function", "page:number"}
 * @property {Object} extras extra stuff of the item
 */

/**
 * An array of items to fill the chest with this is index slot based so index 0 = slot 0
 *@type {Object<string, Page>}
 */
export const PAGES = {};

/**
 * Converts a itemStack to a unique id
 * @param {ItemStack} item
 * @returns {string}
 */
export function getItemUid(item) {
  let uid = "";
  if (item) {
    let { id, name, amount, data } = item;
    let lore = item.getLore();
    uid = [id, name, amount, data, lore].join("");
  }
  return uid;
}

export function addToPages(page) {
  PAGES[page.id] = page;
}

export function actualPages() {
  return PAGES;
}

export class Page {
  /**
   * Items that are in this page
   */
  static items = [];

  /**
   * Converts a itemStack to a  GUI Item
   * @param {ItemStack} item
   * @param {String} action action to preform when this item is grabbed
   * @param {Object} extras extra info to store on the item
   */
  static itemStackToItem(item, action = "give", extras = {}) {
    const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
    const itemEnchants = item.getComponent("enchantments").enchantments;
    const ItemEnchantTypes = [];
    for (const e of MinecraftEnchantments) {
      /**
       * @type {Enchantment}
       */
      const ench = itemEnchants.getEnchantment(e);
      if (!ench) continue;
      ItemEnchantTypes.push({ level: ench.level, id: ench.type.id });
    }
    return {
      uid: getItemUid(item),
      type: item.id,
      amount: item.amount,
      data: item.data,
      name: item.nameTag,
      lore: item.getLore(),
      components: {
        enchantments: ItemEnchantTypes,
      },
      action: action,
      extras: extras,
    };
  }

  /**
   * Creats a new page
   * @param {string} id the unique id of this page
   * @param {number} size the size of the GUI
   * @param {Array<Item>} items items in the page
   * @param {String} fillType how this page fills
   */
  constructor(id, size, fillType = "default") {
    if (size % 9 != 0) return new Error("Size needs to be in a increment of 9");
    if (
      PAGES[id] &&
      !id.startsWith("forplayer:") &&
      !id.startsWith("forrplayer:")
    )
      throw new Error(`Id of ${id} Already exsists`);
    this.id = id;
    this.size = size;
    this.items = Array(this.size);
    this.fillType = fillType;
    PAGES[id] = this;
  }
  /**
   * Adds a item to the page
   * @param {Item} item
   * @param {number} slot where to position the item
   * @returns {Boolean} if it faild or not
   */
  setItem(item, slot = null) {
    if (slot != null) {
      this.items[slot] = item;
      return true;
    } else {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i]) continue;
        return (this.items[i] = item), true;
      }
      return false;
    }
  }

  /**
   * Creates a new item and ads it to this page
   * @param {number} slot The slot you want it to go, leave null for it to be next avaivale slot
   * @param {String} id the id of the item
   * @param {number} amount the ammount of item
   * @param {number} data the data of the item
   * @param {String} action the action to preform when grabbed
   * @param {String} name the name of the item
   * @param {Array<Object>} ench the name of the item
   * @param {string} ench.id the name of the item
   * @param {string} ench.lvl the name of the item
   */
  createItem(
    slot = null,
    id = null,
    amount = 1,
    data = 0,
    action = 0,
    name = "",
    lore = []
  ) {
    let Iitem = null;
    if (!id) {
      Iitem = { type: null };
    } else {
      const item = new ItemStack(
        Items.get(id.includes(":") ? id : "minecraft:" + id),
        amount,
        data
      );
      if (name) item.nameTag = "§m§n§m§r" + name;
      if (lore) item.setLore(lore);
      Iitem = Page.itemStackToItem(item, action);
    }
    this.setItem(Iitem, slot);
    return this;
  }
}
