import {
  BlockLocation,
  Location,
  Entity,
  BlockRaycastOptions,
  world,
  MinecraftBlockTypes,
  // Items,
  // ItemStack,
  // PlayerInventoryComponentContainer,
  // InventoryComponentContainer,
  // MolangVariableMap,
  // Color,
  // BlockPermutation,
} from "@minecraft/server";
//import { SessionBuild } from "./modules/builders/SessionBuilder.js";
import { Shape } from "./modules/builders/ShapeBuilder.js";
import { Fill } from "./modules/builders/AdvancedBuilder.js";
import { WorldEditBuild } from "./modules/builders/WorldEditBuilder.js";
import { SHAPES } from "./modules/definitions/shapes.js";
import "./commands/index.js";
import { SelectionBuild } from "./modules/builders/SelectionBuilder.js";
import { PlayerOption, po, wo } from "../../app/Models/Options.js";
import { SA } from "../../index.js";
import { XA } from "xapi.js";
import { configuration } from "./config.js";
import { P } from "../../config/particles.js";
world.say("§9♦ §fСкрипты были перезагружены.");
new PlayerOption("worldBuilder:NoBrushView", "Отключает партиклы у кисти");
//new PlayerOption("Wand:NoParticles", "Отключает партиклы у лопаты");
//new PlayerOption("Brush:NewMode", "Включает новый режим партиклов у кисти");
//new PlayerOption(  "Shovel:NewMode",  "Включает новый режим партиклов у лопаты");
new PlayerOption("mobile", "Включает мобильное управление");

world.events.blockPlace.subscribe((data) => {
  if (data.block.id != "minecraft:warped_nylium") return;
  const item = SA.Build.entity.getHeldItem(data.player);
  if (!item.getLore()) return;
  const blocks = SA.Utilities.format.clearColors(item.getLore()[0]).split(",");
  const location = data.block.location;
  if (blocks.find((e) => e.split(".")[1])) {
    const block = blocks[~~(Math.random() * blocks.length)];
    SA.Build.chat.runCommand(
      `setblock ${location.x} ${location.y} ${location.z} ${
        block.split(".")[0]
      } ${block.split(".")[1] ? block.split(".")[1] : ""}`
    );
  } else {
    const block = MinecraftBlockTypes.get(
      "minecraft:" + blocks[~~(Math.random() * blocks.length)]
    );
    if (!block) return;
    data.dimension.getBlock(location).setType(block);
  }
});

//////////////////////
///КАЖДЫЕ 10 ТИКОВ///
////////////////////

SA.Utilities.time.setTickInterval(() => {
  for (const p of world.getPlayers()) {
    if (SA.Build.entity.getHeldItem(p)?.id == "we:s") {
      const i = SA.Build.entity.getHeldItem(p);
      const lore = i.getLore();
      if (lore[4] && lore[0] == "§9Adv") {
        const B = lore[1].split(" ")[1].split(",");
        let RB;
        lore[2]?.split(" ")[1] != "any"
          ? (RB = lore[2].split(" ")[1])
          : (RB = "any");

        const R = Number(lore[3].split(" ")[3]);
        if (R < 2) continue;
        const Z = lore[4].split(" ")[1].replace("+", "");
        const H = Number(`${Z}${lore[3].split(" ")[1]}`);
        const O = Number(`${Z}${lore[4].split(" ")[3]}`);
        new Fill(
          new BlockLocation(
            Math.floor(p.location.x - R),
            Math.floor(p.location.y + H),
            Math.floor(p.location.z - R)
          ),
          new BlockLocation(
            Math.floor(p.location.x + R),
            Math.floor(p.location.y + O),
            Math.floor(p.location.z + R)
          ),
          B,
          RB ?? "any"
        );
      }
    }
  }
}, 10);

//////////////////////
/////КАЖДЫЙ ТИК//////
////////////////////

SA.Utilities.time.setTickInterval(() => {
  for (const p of world.getPlayers()) {
    if (
      SA.Build.entity.getHeldItem(p)?.id == "we:s" ||
      (po.Q("mobile", p) &&
        p.hasTag("using_item") &&
        SA.Build.entity.getHeldItem(p)?.id == "we:s")
    ) {
      const i = SA.Build.entity.getHeldItem(p);
      const lore = i.getLore();
      if (lore[4] && lore[0] == "§aActive") {
        const B = lore[1].split(" ")[1];
        const D = lore[1].split(" ")[2];
        const H = lore[3].split(" ")[1];
        const R = lore[3].split(" ")[3];
        const Z = lore[4].split(" ")[1].replace("+", "");
        const O = lore[4].split(" ")[3];
        if (lore[0] == "§aActive")
          p.runCommand(
            `fill ~-${R} ~${Z}${H} ~-${R} ~${R} ~${Z}${O} ~${R} ${B} ${D}`
          );
      }
      if (lore[4] && lore[0] == "§9Adv") {
        const B = lore[1].split(" ")[1].split(",");
        let RB;
        if (lore[2]?.split(" ")[1] != "any") {
          RB = lore[2].split(" ")[1];
        } else {
          RB = "any";
        }
        const R = Number(lore[3].split(" ")[3]);
        if (R > 1) return;
        const Z = lore[4].split(" ")[1].replace("+", "");
        const H = Number(`${Z}${lore[3].split(" ")[1]}`);
        const O = Number(`${Z}${lore[4].split(" ")[3]}`);
        new Fill(
          new BlockLocation(
            Math.floor(p.location.x),
            Math.floor(p.location.y + H),
            Math.floor(p.location.z)
          ),
          new BlockLocation(
            Math.floor(p.location.x),
            Math.floor(p.location.y + O),
            Math.floor(p.location.z)
          ),
          B,
          RB ?? "any"
        );
      }
    }
    if (
      SA.Build.entity.getHeldItem(p)?.id == "we:brush" &&
      !po.Q("worldBuilder:NoBrushView", p)
    ) {
      const lore = SA.Build.entity.getHeldItem(p).getLore();
      const q = new BlockRaycastOptions();
      const range = lore[3]?.replace("Range: ", "");
      if (range) {
        q.maxDistance = parseInt(range);
        const block = p.getBlockFromViewVector(q);
        if (block) {
          const ent1 = SA.Models.world.getEntityAtPos(
            block.location.x,
            block.location.y,
            block.location.z
          );
          if (ent1.length == 0) {
            SA.Build.chat.runCommand(
              `event entity @e[type=f:t,name="${configuration.BRUSH_LOCATOR}",tag="${p.name}"] kill`
            );
            SA.Build.chat.runCommand(
              `summon f:t ${block.location.x} ${
                block.location.y - configuration.H
              } ${block.location.z} spawn "${configuration.BRUSH_LOCATOR}"`
            );
            SA.Build.chat.runCommand(
              `tag @e[x=${block.location.x},y=${
                block.location.y - configuration.H
              },z=${block.location.z},r=1,type=f:t,name="${
                configuration.BRUSH_LOCATOR
              }"] add "${p.name}"`
            );
          }
          for (let ent of ent1) {
            if (ent.id == "f:t" && ent.nameTag == configuration.BRUSH_LOCATOR)
              break;
            SA.Build.chat.runCommand(
              `event entity @e[type=f:t,name="${configuration.BRUSH_LOCATOR}",tag="${p.name}"] kill`
            );
            SA.Build.chat.runCommand(
              `summon f:t ${block.location.x} ${
                block.location.y - configuration.H
              } ${block.location.z} spawn "${configuration.BRUSH_LOCATOR}"`
            );
            SA.Build.chat.runCommand(
              `tag @e[x=${block.location.x},y=${
                block.location.y - configuration.H
              },z=${block.location.z},r=1,type=f:t,name="${
                configuration.BRUSH_LOCATOR
              }"] add "${p.name}"`
            );
            break;
          }
        }
      }
    } else {
      SA.Build.chat.runCommand(
        `event entity @e[type=f:t,name="${configuration.BRUSH_LOCATOR}",tag="${p.name}"] kill`
      );
    }
  }
}, 0);

SA.Utilities.time.setTickInterval(() => {
  for (const p of world.getPlayers()) {
    //console.warn(p.name + " id fail");
    if (
      !p.hasTag("mobile") ||
      !p.hasTag("attacking") ||
      SA.Build.entity.getHeldItem(p)?.id != "we:brush"
    )
      continue; ////console.warn(p.name + " id fail");

    const lore = SA.Build.entity.getHeldItem(p).getLore();
    const shape = lore[0]?.replace("Shape: ", "");
    const blocks = lore[1]?.replace("Blocks: ", "").split(",");
    const size = lore[2]?.replace("Size: ", "");
    const range = lore[3]?.replace("Range: ", "");
    if (!shape || !blocks || !size || !range) continue;
    const q = new BlockRaycastOptions();
    q.maxDistance = parseInt(range);
    const block = p.getBlockFromViewVector(q);

    if (block) new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
  }
}, 5);

//////////////////////////////////
/////ИСПОЛЬЗОВАНИЕ НА БЛОКЕ//////
////////////////////////////////

world.events.beforeItemUseOn.subscribe((data) => {
  if (data.item.id === "we:wand") {
    const poss = WorldEditBuild.getPoses().p2;
    if (
      poss.x == data.blockLocation.x &&
      poss.y == data.blockLocation.y &&
      poss.z == data.blockLocation.z
    )
      return;
    SelectionBuild.setPos2(
      data.blockLocation.x,
      data.blockLocation.y,
      data.blockLocation.z
    );
    world.say(
      `§d►2◄§f (использовать) ${data.blockLocation.x}, ${data.blockLocation.y}, ${data.blockLocation.z}`,
      data.source.nameTag
    );
  }
});

/////////////////////////
/////ИСПОЛЬЗОВАНИЕ//////
///////////////////////
world.events.beforeItemUse.subscribe((data) => {
  if (data.item.id === "we:s") {
    let lore = data.item.getLore();
    let q = true;
    switch (lore[0]) {
      case "§Active":
        if (!q) break;
        lore[0] = "§cDisactive";
        q = false;
        break;
      case "§cDisactive":
        if (!q) break;
        lore[0] = "§aActive";
        q = false;
        break;
      case "§9Adv":
        if (!q) break;
        lore[0] = "§cAdv";
        q = false;
        break;
      case "§cAdv":
        if (!q) break;
        lore[0] = "§9Adv";
        q = false;
        break;
    }
    const item = data.item;
    item.setLore(lore);
    data.source
      .getComponent("minecraft:inventory")
      .container.setItem(data.source.selectedSlot, item);
  }

  if (data.item.id != "we:brush") return;
  if (po.Q("mobile", data.source)) return;
  const lore = data.item.getLore();
  const shape = lore[0]?.replace("Shape: ", "");
  const blocks = lore[1]?.replace("Blocks: ", "").split(",");
  const size = lore[2]?.replace("Size: ", "");
  const range = lore[3]?.replace("Range: ", "");
  if (!shape || !blocks || !size || !range) return;
  const q = new BlockRaycastOptions();
  q.maxDistance = parseInt(range);
  const block = data.source.getBlockFromViewVector(q);
  if (block) new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
});
world.events.itemUse.subscribe((data) => {
  if (data.item.id.startsWith("l:")) {
    data.source.runCommand(`tp ^^^5`);
  }
});

////////////////////////////
/////РАЗРУШЕНИЕ БЛОКА//////
//////////////////////////
world.events.blockBreak.subscribe((data) => {
  if (SA.Build.entity.getHeldItem(data.player)?.id != "we:wand") return;
  const poss = WorldEditBuild.getPoses().p2;
  if (
    poss.x == data.block.location.x &&
    poss.y == data.block.location.y &&
    poss.z == data.block.location.z
  )
    return;
  SelectionBuild.setPos1(
    data.block.location.x,
    data.block.location.y,
    data.block.location.z
  );
  world.say(
    `§5►1◄§r (сломать) ${data.block.location.x}, ${data.block.location.y}, ${data.block.location.z}`,
    data.player.name
  );
  data.dimension
    .getBlock(data.block.location)
    .setPermutation(data.brokenBlockPermutation);
});

SA.Utilities.time.setTickInterval(() => {
  WorldEditBuild.drawSelection();
}, 20);
