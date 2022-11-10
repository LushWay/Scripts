// @ts-nocheck

import {
  Items,
  ItemStack,
  PlayerInventoryComponentContainer,
  world,
} from "@minecraft/server";
import { setTickInterval, setTickTimeout, XA } from "xapi.js";
import { gs } from "./config";

//Обновление лора при выстреле
world.events.dataDrivenEntityTriggerEvent.subscribe((data) => {
  if (data.entity.typeId != "minecraft:player") return;
  if (!Object.keys(gs).find((e) => data.id.startsWith(e))) return;
  //console.warn(data.id)  // !Object.keys(gs).find(e => data.id == e + '_bullet_scope' || data.id == e + '_bullet_noscope')
  const item = XA.Entity.getHeldItem(data.entity);
  let lore = item.getLore();
  const gun = gs[item?.typeId?.split(":")[1]];
  const mb = gun.maxAmmo;
  let b;
  if (lore[0]) {
    b = XA.Entity.getScore(data.entity, gun.scoreName) - 1;
    lore[0] = `§r§f${String(b).replace("NaN", gun.maxAmmo)}/${mb}`;
  } else lore[0] = `§r§f0/${mb}`; //§r
  item.setLore(lore);
  /**
   * @type {PlayerInventoryComponentContainer}
   */
  const i = data.entity.getComponent("minecraft:inventory").container;

  i.setItem(data.entity.selectedSlot, item);
});

//Обновление лора каждый тик
setTickInterval(() => {
  for (const pl of world.getPlayers()) {
    const item = XA.Entity.getHeldItem(pl);
    /**
     * @type {import("./config.js").gun}
     */
    const gun = gs[item?.typeId?.split(":")[1]];

    if (gun) {
      let lore = item.getLore();
      if (lore[0]) {
        XA.Chat.runCommand(
          `scoreboard players set "${pl.name}" ${gun.scoreName} ` +
            lore[0].split("/")[0].replace(/§./g, "") // §r
        );
      }

      // lore[0] = `§r§c${gun.maxAmmo}/${gun.maxAmmo}`
      // item.setLore(lore)
      // XA.Entity.getI(pl).setItem(pl.selectedSlot, item)
      else
        XA.Chat.runCommand(
          `scoreboard players set "${pl.name}" ${gun.scoreName} 0`
        );
    }
  }
}, 0);

//перезарядка
setTickInterval(() => {
  for (const pl of world.getPlayers()) {
    ///предмет в руке
    const item = XA.Entity.getHeldItem(pl);
    //лор предмета
    let lore = item?.getLore();
    //перезарядка уже производится
    if (lore && lore[0] == "§r§cReloading...") return;
    //перезарядка идет, а в руках другой предмет
    if (XA.Entity.getTagStartsWith(pl, "reload:")) {
      //находит перезаряжающееся оружие
      const imho = XA.Entity.findItem(
        pl,
        XA.Entity.getTagStartsWith(pl, "reload:") + "_empty",
        "§r§cReloading..."
      );
      // если его нет, это баг, значит удаляем тэг
      if (!imho)
        return pl.removeTag(
          "reload:" + XA.Entity.getTagStartsWith(pl, "reload:")
        );
      //выдаем пустое оружие вместо перезаряжающегося
      XA.Entity.getI(pl).setItem(
        imho[1],
        new ItemStack(
          Items.get(imho[0].typeId.replace("_empty", "") + "_empty"),
          1,
          0
        )
      );
      //сообщаем об этом на экран
      pl.runCommand("scoreboard players set @s lockedtitle 3");
      pl.onScreenDisplay.setActionBar("§cReload canceled");
      //возвращаем пули
      XA.Chat.runCommand(
        `give "${pl.name}" b:l ${imho[0].getLore()[1].cc().split("/")[0]}`
      );
      //удаляем тэг
      pl.removeTag("reload:" + XA.Entity.getTagStartsWith(pl, "reload:"));
    }
    //предмета нет, дальнейшие взаимодействия невозможны
    if (!item) return;
    //объявляем статические переменные
    /**
     * @type {import("./config.js").gun}
     */
    let gun,
      empty = false,
      bullsInOffhand = false;

    let c = XA.Entity.getItemsCount(pl, "b:l");
    if (c == 0 && XA.Entity.hasItem(pl, "weapon.offhand", "b:l")) {
      c = XA.Entity.getItemsCountClear(pl, "b:l");
      bullsInOffhand = true;
    }
    if (gs[item?.typeId?.split(":")[1]]) {
      if (!bullsInOffhand && !XA.Entity.hasItem(pl, "weapon.offhand", "b:l"))
        return;
      gun = gs[item?.typeId?.split(":")[1]];
    } else if (gs[item?.typeId?.split(":")[1].replace("_empty", "")]) {
      if (c < 1)
        return [
          pl.runCommand("scoreboard players set @s lockedtitle 3"),
          pl.onScreenDisplay.setActionBar("§cНет патрон"),
        ];
      empty = true;
      gun = gs[item?.typeId?.split(":")[1].replace("_empty", "")];
    } else return;
    let ostB = empty ? 0 : Number(lore[0].cc().split("/")[0]);
    c = ostB + c;
    pl.runCommand(
      "scoreboard players set @s lockedtitle " + Math.floor(gun.reloadTime)
    );
    pl.onScreenDisplay.setActionBar("§cReload");
    lore[0] = "§r§cReloading...";
    lore[1] = `§r§f${
      Number(XA.Entity.clearItems(pl, "b:l", gun.maxAmmo - ostB)) + Number(ostB)
    }/${gun.maxAmmo}`.replace("NaN", gun.maxAmmo);
    lore[2] = "§r§7" + c;
    pl.runCommand(
      `replaceitem entity @s slot.weapon.mainhand 0 ${item.typeId.replace(
        "_empty",
        ""
      )}_empty`
    );
    const ii = XA.Entity.getHeldItem(pl);
    ii.setLore(lore);
    XA.Entity.getI(pl).setItem(pl.selectedSlot, ii);
    pl.addTag("reload:" + item.typeId.replace("_empty", ""));
    pl.runCommand("event entity @s mark:reload");
    pl.runCommand("scoreboard players set @s clReTime 20");
    setTickTimeout(() => {
      if (!pl.hasTag("reload:" + item.typeId.replace("_empty", ""))) return;
      pl.removeTag("reload:" + item.typeId.replace("_empty", ""));
      const it = new ItemStack(
        Items.get(item.typeId.replace("_empty", "")),
        1,
        0
      );
      let lorec = [];
      lorec[0] = lore[1];
      it.setLore(lorec);
      XA.Entity.getI(pl).setItem(pl.selectedSlot, it);
    }, gun.reloadTime * 20);
  }
});

//Обнуление триггера анимации
setTickInterval(() => {
  XA.Chat.rcs([
    "scoreboard objectives add clReTime dummy",
    "scoreboard players add @a[scores={mark=2,clReTime=1..}] clReTime -1",
    "event entity @a[scores={mark=2,clReTime=0}] mark:clear",
  ]);
}, 0);

setTickInterval(() => {
  for (const e of world.getDimension("overworld").getEntities()) {
    if (e.typeId != "f:t" || !e.nameTag.startsWith("с: ")) continue;
    const ent = e.dimension.getEntities({
      location: e.location,
      excludeTypes: ["minecraft:player", "f:t"],
      maxDistance: 5,
      closest: 2,
    });
    e.nameTag = `с: ${ent.length + Number(e.nameTag.split(" ")[1])} ${
      e.nameTag.split(" ")[2]
    } ${e.nameTag.split(" ")[3]?.replace("NaN", 0)}`;
    const p = XA.Entity.getClosetsEntitys(e, 5, "minecraft:player").find((p) =>
      p.hasTag("attacking")
    );
    if (p) e.nameTag = `с:§c 0 0 0`;
  }
});

setTickInterval(() => {
  for (const e of world.getDimension("overworld").getEntities()) {
    if (e.typeId != "f:t" || !e.nameTag.startsWith("с: ")) continue;
    e.nameTag = `с: 0 ${e.nameTag.split(" ")[1]} ${Math.max(
      e.nameTag.split(" ")[2],
      e.nameTag.split(" ")[3]?.replace("NaN", 0)
    )}`;
  }
}, 80);
