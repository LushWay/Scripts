import { Vector, system, world } from "@minecraft/server";
import { XA } from "xapi.js";

/**
 *
 * @param {number} max
 * @param {number} min
 * @param {string} msg
 * @returns
 */
export function rd(max, min = 0, msg) {
	if (max == min || max < min) return max;

	const rd = Math.round(min + Math.random() * (max - min));
	if (msg) world.say(msg + "\nmax: " + max + " min: " + min + " rd: " + rd);
	return rd;
}

// export class airdrope {
//   /**
//    *
//    * @param {number} posx
//    * @param {number} posz
//    * @param {number} loot_tier
//    * @returns
//    */
//   constructor(posx, posz, loot_tier = 0) {
//     if (loot_tier > 3 || loot_tier < 0)
//       throw new Error("[airdrop] Тир большой");
//     this.x = posx;
//     this.z = posz;
//     /**
//      * @type {Array<ItemStack | "air">}
//      */
//     this.loot = this.getTable(loot_tier);
//     this.summon();
//   }
//   shuffle(arr) {
//     for (let i = arr.length - 1; i > 0; i--) {
//       let j = Math.floor(Math.random() * (i + 1));
//       [arr[i], arr[j]] = [arr[j], arr[i]];
//     }
//     return arr;
//   }
//   spread(arr) {
//     for (let i = 0; i <= arr.length; i++) {
//       if (
//         arr[i]?.amount > 3 &&
//         arr.filter((e) => e == "air").length >
//           arr.filter((e) => e != "air").length
//       ) {
//         let c = arr.filter((e) => e == "air").length,
//           cc = 0,
//           j;
//         for (const [ii, el] of arr.entries()) {
//           if (el != "air") continue;
//           if (c > cc && Math.round(Math.random())) continue;
//           j = ii;
//           break;
//         }
//         const mi = rd(arr[i].amount, 1);
//         arr[j] = {};
//         Object.assign(arr[j], arr[i]);
//         const am = arr[i].amount;
//         arr[i].amount = am - mi;
//         arr[j].amount = arr[j].amount - arr[i].amount;
//       }
//     }
//   }
//   getTable(t) {
//     /**
//      * @type {Array}
//      */
//     let array = XA.tables.drops.get("drop:" + rd(t, 1));
//     if (!array) throw new Error(t);
//     for (let o = 0; o <= 26 - array.length; o++) {
//       array.push("air");
//     }
//     this.shuffle(array);
//     this.spread(array);
//     this.spread(array);
//     this.spread(array);
//     this.spread(array);
//     return array;
//   }
//   summon() {
//     let y,
//       x,
//       z,
//       C = 0;
//     while (!y && C < 30) {
//       C++;
//       x = rd(this.x + 10, this.x - 10);
//       z = rd(this.z + 10, this.z - 10);
//       let ac = 0;
//       for (let v = 62; v <= 320; v++) {
//         const b = world
//           .getDimension("overworld")
//           .getBlock({ x: x, y: v, z: z) };
//         if (b.typeId == "minecraft:air") {
//           ac++;
//           if (ac < 100) continue;
//           y = v;
//           break;
//         }
//       }
//     }
//     const ent = world
//       .getDimension("overworld")
//       .spawnEntity("minecraft:chest_minecart", { x: x, y: y, z: z) };
//     const inv = XA.Entity.getI(ent);
//     for (let i = 0; i < inv.size; i++) {
//       const n = this.loot[i];
//       if (!n || n == "air") continue;
//       const count = rd(n.amount, Number(n.lore[0]));
//       if (count == 0) continue;
//       let it = new ItemStack(Items.get(n.id), count, n.data);
//       if (n.lore[1]) {
//         /**
//          * @type {EnchantmentList}
//          */
//         let ench = it.getComponent("enchantments").enchantments;
//         let enc = 0,
//           lvl = 0;
//         for (let e of this.shuffle(Object.values(MinecraftEnchantmentTypes))) {
//           lvl = Number(n.lore[2]);
//           if (lvl > e.maxLevel) lvl = e.maxLevel;
//           if (ench.canAddEnchantment(new Enchantment(e, Number(lvl)))) {
//             if (enc >= n.lore[4]) break;
//             if (enc >= n.lore[3]) {
//               if (Math.round(Math.random())) {
//                 const l = rd(lvl, Number(n.lore[1]));
//                 if (l < 1) continue;
//                 ench.addEnchantment(new Enchantment(e, l));
//               }
//             } else {
//               const l = rd(lvl, Number(n.lore[1]));
//               if (l < 1) continue;
//               ench.addEnchantment(new Enchantment(e, l));
//             }
//             enc++;
//           }
//         }
//         it.getComponent("enchantments").enchantments = ench;
//       }
//       inv.setItem(i, it);
//     }
//     const chicken = world
//       .getDimension("overworld")
//       .spawnEntity("minecraft:chicken<drop>", { x: x, y: y + 3, z: z) };
//     chicken.addEffect(MinecraftEffectTypes.slowFalling, 500, 2, false);
//     chicken.addEffect(MinecraftEffectTypes.resistance, 500, 255, false);
//     const date = Date.now();
//     chicken.addTag("держит_эирдроп_номер:" + date);
//     chicken.addTag("держит");
//     ent.addTag("держится_за_номер:" + date);
//     ent.addTag("держится");
//   }
// }
const q = {
	tags: ["держит"],
	type: "minecraft:chicken",
};

system.runInterval(
	() => {
		for (const ent of world.getDimension("overworld").getEntities(q)) {
			if (!XA.Entity.getTagStartsWith(ent, "держит_эирдроп_номер:"))
				return ent.removeTag("держит");

			const cl = ent.dimension.getEntities({
				maxDistance: 20,
				location: ent.location,
				tags: [
					"держится_за_номер:" +
						XA.Entity.getTagStartsWith(ent, "держит_эирдроп_номер:"),
				],
			});
			if (!cl) return ent.removeTag("держит");
			const block = ent.dimension.getBlock(
				Vector.floor({
					x: ent.location.x,
					y: ent.location.y - 4,
					z: ent.location.z,
				})
			);
			const block2 = ent.dimension.getBlock(
				Vector.floor({
					x: ent.location.x,
					y: ent.location.y - 1,
					z: ent.location.z,
				})
			);
			if (block2.typeId != "minecraft:air") {
				XA.Entity.despawn(ent);
				continue;
			}
			for (const clo of cl) {
				const rotation = clo.getRotation();
				if (block.typeId == "minecraft:air")
					clo.teleport(
						{ x: ent.location.x, y: ent.location.y - 3, z: ent.location.z },
						ent.dimension,
						rotation.x,
						rotation.y
					);
				break;
			}
		}
	},
	"airDrop",
	0
); /*
/*
const kit = new XA.Command({
  name: "drop",
  description: "Управление таблицами дропа",
  require: "moderator",
}).executes((ctx) => {
  new airdrope(
    Math.floor(ctx.sender.location.x),
    Math.floor(ctx.sender.location.z),
    ctx.args[0]
  );
});

kit
  .literal({
    name: "item",
    description: "Опции предмета",
    requires: (p) => p.getTags().includes("commands"),
  })
  .int("mincount")
  .boolean("ench", true)
  .int("maxenchlvl", true)
  .int("minenchlvl", true)

  .int("minenchcount", true)
  .int("maxenchcount", true)
  .executes(
    (
      ctx,
      mincount,
      maxenchlvl,
      minenchlvl,
      maxenchcount,
      minenchcount,
      ench
    ) => {
      let item = XA.Entity.getHeldItem(ctx.sender),
        oldtag = item.getLore(),
        lore = [mincount + ""];

      if (ench) {
        [
          minenchlvl + "",
          maxenchlvl + "",
          minenchcount + "",
          maxenchcount + "",
        ].forEach((e) => lore.push(e));
      }
      item.setLore(lore);
      XA.Entity.getI(ctx.sender).setItem(ctx.sender.selectedSlot, item);
      ctx.reply(`§a► §f${oldtag ?? ""} ► ${item.getLore()}§r`);
    }
  );

kit
  .literal({
    name: "add",
    description: "Добавляет",
    require: "moderator",
  })
  .int("number")
  .executes((ctx,  number ) => {
    if (number > 3 || number < 0) return ctx.reply("§сМн");
    const wb = ctx.sender.dimension.getBlock(
      new BlockLocation(
        Math.floor(ctx.sender.location.x),
        Math.floor(ctx.sender.location.y),
        Math.floor(ctx.sender.location.z)
      )
    );
    const b = wb.getComponent("inventory")?.container;
    if (!b)
      return ctx.reply("§cВстань на сундук с дропом! (блок: " + wb.id + ")");
    let inv = [];
    for (let i = 0; i < b.size; i++) {
      /**
       * @type {ItemStack}
       */ /*
      const item = b.getItem(i);
      if (item)
        inv.push({
          id: item.id,
          amount: item.amount,
          data: item.data,
          name: item.name ?? " ",
          lore: item.getLore(),
        });
    }
    ctx.reply(
      `§fДобавлен  дроп с такими предметами:\n  §7` +
        toStr(inv, " ")
    );
    XA.tables.drops.set("drop:" + number, inv);
  });

kit
  .literal({
    name: "del",
    description: "ДЦт",
    require: "moderator",
  })
  .string("number")
  .executes((ctx,  number ) => {
    const n = XA.tables.drops.keys().find((e) => e.endsWith(number));
    if (!n)
      return ctx.reply(
        `§cАирдропа с номером '§f${number}§c' не существует. \n§fДоступные дропы: \n  §7` +
          XA.tables.drops.keys().join("\n  ")
      );
    ctx.reply(`§7Удален дроп с таким названием: §6${n}`); //§r
    XA.tables.drops.delete(n);
  });
kit
  .literal({ name: "red", description: "Редактирует кит" })
  .int("name")
  .executes((ctx,  name ) => {
    const kits = XA.tables.drops.keys();
    if (kits.length < 1) return ctx.reply("§cНет дропов");
    const n = kits.find((e) => e.split(":")[1].endsWith(name));
    if (!n)
      return ctx.reply(
        `§cДропа с номером '§f${name}§c' не существует. \n§fДоступные дропы: \n  §7` +
          XA.tables.drops.keys().join("\n  ")
      );
    const kit = XA.tables.drops.get(n);
    ctx.sender.runCommandAsync("setblock ~~~ chest");
    /** * @type {BlockInventoryComponentContainer} */ /* const inv =
      ctx.sender.dimension
        .getBlock(XA.Entity.locationToBlockLocation(ctx.sender.location))
        .getComponent("inventory").container;
    for (const [i, k] of kit.entries()) {
      const st = new ItemStack(Items.get(k.id), k.amount, k.data);
      if (k.name) st.nameTag = k.name;
      if (k.lore) st.setLore(k.lore);
      inv.setItem(i, st);
    }
    ctx.reply(
      `§7Редактирование кита §6${name}§7! Когда закончишь, встань на сундук и пропиши §f-drop add ${name}`
    );
  });
*/


