import {
  Player,
  world,
  PlayerInventoryComponentContainer,
  EntityIterator,
  ItemStack,
  Items,
} from "@minecraft/server";
import { clearColors } from "../../app/Utilities/formatter";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { gs } from "./config";

//Обновление лора при выстреле
world.events.dataDrivenEntityTriggerEvent.subscribe((data) => {
  if (data.entity.typeId != "minecraft:player") return;
  if (!Object.keys(gs).find((e) => data.id.startsWith(e))) return;
  //console.warn(data.id)  // !Object.keys(gs).find(e => data.id == e + '_bullet_scope' || data.id == e + '_bullet_noscope')
  const item = SA.Build.entity.getHeldItem(data.entity);
  let lore = item.getLore();
  const gun = gs[item?.id?.split(":")[1]];
  const mb = gun.maxAmmo;
  let b;
  if (lore[0]) {
    b = SA.Build.entity.getScore(data.entity, gun.scoreName) - 1;
    lore[0] = `§r§f${String(b).replace("NaN", gun.maxAmmo)}/${mb}`;
  } else lore[0] = `§r§f0/${mb}`;
  item.setLore(lore);
  /**
   * @type {PlayerInventoryComponentContainer}
   */
  const i = data.entity.getComponent("minecraft:inventory").container;

  i.setItem(data.entity.selectedSlot, item);
});

//Обновление лора каждый тик
SA.Utilities.time.setTickInterval(() => {
  for (const pl of world.getPlayers()) {
    const item = SA.Build.entity.getHeldItem(pl);
    /**
     * @type {import("./config.js").gun}
     */
    const gun = gs[item?.id?.split(":")[1]];

    if (gun) {
      let lore = item.getLore();
      if (lore[0]) {
        SA.Build.chat.runCommand(
          `scoreboard players set "${pl.name}" ${gun.scoreName} ` +
            clearColors(lore[0].split("/")[0])
        );
      }

      // lore[0] = `§r§c${gun.maxAmmo}/${gun.maxAmmo}`
      // item.setLore(lore)
      // SA.Build.entity.getI(pl).setItem(pl.selectedSlot, item)
      else
        SA.Build.chat.runCommand(
          `scoreboard players set "${pl.name}" ${gun.scoreName} 0`
        );
    }
  }
}, "gunslore");

//перезарядка
SA.Utilities.time.setTickInterval(() => {
  for (const pl of world.getPlayers()) {
    ///предмет в руке
    const item = SA.Build.entity.getHeldItem(pl);
    //лор предмета
    let lore = item?.getLore();
    //перезарядка уже производится
    if (lore && lore[0] == "§r§cReloading...") return;
    //перезарядка идет, а в руках другой предмет
    if (SA.Build.entity.getTagStartsWith(pl, "reload:")) {
      //находит перезаряжающееся оружие
      const imho = SA.Build.entity.findItem(
        pl,
        SA.Build.entity.getTagStartsWith(pl, "reload:") + "_empty",
        "§r§cReloading..."
      );
      // если его нет, это баг, значит удаляем тэг
      if (!imho)
        return pl.removeTag(
          "reload:" + SA.Build.entity.getTagStartsWith(pl, "reload:")
        );
      //выдаем пустое оружие вместо перезаряжающегося
      SA.Build.entity
        .getI(pl)
        .setItem(
          imho[1],
          new ItemStack(
            Items.get(imho[0].id.replace("_empty", "") + "_empty"),
            1,
            0
          )
        );
      //сообщаем об этом на экран
      pl.runCommand("scoreboard players set @s lockedtitle 3");
      pl.onScreenDisplay.setActionBar("§cReload canceled");
      //возвращаем пули
      SA.Build.chat.runCommand(
        `give "${pl.name}" b:l ${
          SA.Utilities.format.clearColors(imho[0].getLore()[1]).split("/")[0]
        }`
      );
      //удаляем тэг
      pl.removeTag("reload:" + SA.Build.entity.getTagStartsWith(pl, "reload:"));
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

    let c = SA.Build.entity.getItemsCount(pl, "b:l");
    if (c == 0 && SA.Build.entity.hasItem(pl, "weapon.offhand", "b:l")) {
      c = SA.Build.entity.getItemsCountClear(pl, "b:l");
      bullsInOffhand = true;
    }
    if (gs[item?.id?.split(":")[1]]) {
      if (
        !bullsInOffhand &&
        !SA.Build.entity.hasItem(pl, "weapon.offhand", "b:l")
      )
        return;
      gun = gs[item?.id?.split(":")[1]];
    } else if (gs[item?.id?.split(":")[1].replace("_empty", "")]) {
      if (c < 1)
        return [
          pl.runCommand("scoreboard players set @s lockedtitle 3"),
          pl.onScreenDisplay.setActionBar("§cНет патрон"),
        ];
      empty = true;
      gun = gs[item?.id?.split(":")[1].replace("_empty", "")];
    } else return;
    let ostB = empty
      ? 0
      : Number(SA.Utilities.format.clearColors(lore[0]).split("/")[0]);
    c = ostB + c;
    pl.runCommand(
      "scoreboard players set @s lockedtitle " + Math.floor(gun.reloadTime)
    );
    pl.onScreenDisplay.setActionBar("§cReload");
    lore[0] = "§r§cReloading...";
    lore[1] = `§r§f${
      Number(SA.Build.entity.itemsCountClear(pl, "b:l", gun.maxAmmo - ostB)) +
      Number(ostB)
    }/${gun.maxAmmo}`.replace("NaN", gun.maxAmmo);
    lore[2] = "§r§7" + c;
    pl.runCommand(
      `replaceitem entity @s slot.weapon.mainhand 0 ${item.id.replace(
        "_empty",
        ""
      )}_empty`
    );
    const ii = SA.Build.entity.getHeldItem(pl);
    ii.setLore(lore);
    SA.Build.entity.getI(pl).setItem(pl.selectedSlot, ii);
    pl.addTag("reload:" + item.id.replace("_empty", ""));
    pl.runCommand("event entity @s mark:reload");
    pl.runCommand("scoreboard players set @s clReTime 20");
    SA.Utilities.time.setTickTimeout(() => {
      if (!pl.hasTag("reload:" + item.id.replace("_empty", ""))) return;
      pl.removeTag("reload:" + item.id.replace("_empty", ""));
      const it = new ItemStack(Items.get(item.id.replace("_empty", "")), 1, 0);
      let lorec = [];
      lorec[0] = lore[1];
      it.setLore(lorec);
      SA.Build.entity.getI(pl).setItem(pl.selectedSlot, it);
    }, gun.reloadTime * 20);
  }
});

//Обнуление триггера анимации
SA.Utilities.time.setTickInterval(() => {
  SA.Build.chat.rcs([
    "scoreboard objectives add clReTime dummy",
    "scoreboard players add @a[scores={mark=2,clReTime=1..}] clReTime -1",
    "event entity @a[scores={mark=2,clReTime=0}] mark:clear",
  ]);
}, 0);

SA.Utilities.time.setTickInterval(() => {
  for (const e of world.getDimension("overworld").getEntities()) {
    if (e.typeId != "f:t" || !e.nameTag.startsWith("с: ")) continue;
    const ent = SA.Build.entity.getCClosetsEntitys(e, 5, [
      "minecraft:player",
      "f:t",
    ]);
    e.nameTag = `с: ${ent.length + Number(e.nameTag.split(" ")[1])} ${
      e.nameTag.split(" ")[2]
    } ${e.nameTag.split(" ")[3]?.replace("NaN", 0)}`;
    const p = SA.Build.entity
      .getClosetsEntitys(e, 5, "minecraft:player")
      .find((p) => p.hasTag("attacking"));
    if (p) e.nameTag = `с:§c 0 0 0`;
  }
});

SA.Utilities.time.setTickInterval(() => {
  for (const e of world.getDimension("overworld").getEntities()) {
    if (e.typeId != "f:t" || !e.nameTag.startsWith("с: ")) continue;
    e.nameTag = `с: 0 ${e.nameTag.split(" ")[1]} ${Math.max(
      e.nameTag.split(" ")[2],
      e.nameTag.split(" ")[3]?.replace("NaN", 0)
    )}`;
  }
}, 80);
