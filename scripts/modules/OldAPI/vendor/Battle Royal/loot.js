import {
  BlockLocation,
  BlockRaycastOptions,
  Enchantment,
  Items,
  ItemStack,
  Location,
  MinecraftBlockTypes,
  MinecraftEnchantmentTypes,
  Vector,
  world,
} from "@minecraft/server";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { rd } from "../Airdrops/index.js";

export class LootChest {
  /**
   *
   * @param {Number} posx
   * @param {Number} posz
   * @param {Number} loot_tier
   */
  constructor(posx, posz, loot_tier = 1, rdrad) {
    this.pos = LootChest.summon(
      posx,
      posz,
      LootChest.getTable(loot_tier),
      rdrad
    );
  }
  static shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  static spread(arr) {
    for (let i = 0; i <= arr.length; i++) {
      if (
        arr[i]?.amount > 3 &&
        arr.filter((e) => e == "air").length >
          arr.filter((e) => e != "air").length
      ) {
        let c = arr.filter((e) => e == "air").length,
          cc = 0,
          j;
        for (const [ii, el] of arr.entries()) {
          if (el != "air") continue;
          if (c > cc && Math.round(Math.random())) continue;
          j = ii;
          break;
        }
        const mi = rd(arr[i].amount, 1);
        arr[j] = {};
        Object.assign(arr[j], arr[i]);
        const am = arr[i].amount;
        arr[i].amount = am - mi;
        arr[j].amount = arr[j].amount - arr[i].amount;
      }
    }
  }
  static getTable(t) {
    /**
     * @type {Array<ItemStack>}
     */
    let array = SA.tables.drops.get("drop:" + t);
    if (!array) throw new Error("§cНет массива под именем: " + t);
    for (let o = 0; o <= 26 - array.length; o++) {
      array.push("air");
    }
    LootChest.shuffle(array);
    LootChest.shuffle(array);
    LootChest.shuffle(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    LootChest.spread(array);
    return array;
  }
  static summon(xz, zx, loot, rdrad) {
    let x,
      z,
      C = 0,
      block;
    while (!block && C < 150) {
      C++;
      x = rd(xz + rdrad, xz - rdrad);
      z = rd(zx + rdrad, zx - rdrad);
      const q = new BlockRaycastOptions();
      (q.includeLiquidBlocks = false), (q.includePassableBlocks = false);
      const b = world
        .getDimension("overworld")
        .getBlockFromRay(new Location(x, 320, z), new Vector(0, -1, 0));
      if (b && b.location.y >= 50) {
        block = b.dimension.getBlock(
          new BlockLocation(b.location.x, b.location.y + 1, b.location.z)
        );
        break;
      }
    }
    if (!block) return false;
    block.setType(MinecraftBlockTypes.chest);
    const inv = block.getComponent("inventory").container;
    for (let i = 0; i < inv.size; i++) {
      const n = loot[i];
      if (!n || n == "air") continue;
      const count = rd(n.amount, Number(n.lore[0]));
      if (count == 0) continue;
      let it = new ItemStack(Items.get(n.id), count, n.data);
      if (n.lore[1]) {
        /**
         * @type {EnchantmentList}
         */
        let ench = it.getComponent("enchantments").enchantments;
        let enc = 0,
          lvl = 0;
        for (let e of LootChest.shuffle(
          Object.values(MinecraftEnchantmentTypes)
        )) {
          lvl = Number(n.lore[2]);
          if (lvl > e.maxLevel) lvl = e.maxLevel;
          if (ench.canAddEnchantment(new Enchantment(e, Number(lvl)))) {
            if (enc >= n.lore[4]) break;
            if (enc >= n.lore[3]) {
              if (Math.round(Math.random())) {
                const l = rd(lvl, Number(n.lore[1]));
                if (l < 1) continue;
                ench.addEnchantment(new Enchantment(e, l));
              }
            } else {
              const l = rd(lvl, Number(n.lore[1]));
              if (l < 1) continue;
              ench.addEnchantment(new Enchantment(e, l));
            }
            enc++;
          }
        }
        it.getComponent("enchantments").enchantments = ench;
      }
      inv.setItem(i, it);
    }
    return `${block.location.x} ${block.location.y} ${block.location.z}`;
  }
  static set(inv, loot) {
    for (let i = 0; i < inv.size; i++) {
      const n = loot[i];
      if (!n || n == "air") continue;
      const count = rd(n.amount, Number(n.lore[0]));
      if (count == 0) continue;
      let it = new ItemStack(Items.get(n.id), count, n.data);
      if (n.lore[1]) {
        /**
         * @type {EnchantmentList}
         */
        let ench = it.getComponent("enchantments").enchantments;
        let enc = 0,
          lvl = 0;
        for (let e of LootChest.shuffle(
          Object.values(MinecraftEnchantmentTypes)
        )) {
          lvl = Number(n.lore[2]);
          if (lvl > e.maxLevel) lvl = e.maxLevel;
          if (ench.canAddEnchantment(new Enchantment(e, Number(lvl)))) {
            if (enc >= n.lore[4]) break;
            if (enc >= n.lore[3]) {
              if (Math.round(Math.random())) {
                const l = rd(lvl, Number(n.lore[1]));
                if (l < 1) continue;
                ench.addEnchantment(new Enchantment(e, l));
              }
            } else {
              const l = rd(lvl, Number(n.lore[1]));
              if (l < 1) continue;
              ench.addEnchantment(new Enchantment(e, l));
            }
            enc++;
          }
        }
        it.getComponent("enchantments").enchantments = ench;
      }
      inv.setItem(i, it);
    }
  }
}
