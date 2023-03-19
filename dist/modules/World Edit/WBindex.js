import { Player, world } from "@minecraft/server";
import { setPlayerInterval, setTickInterval, XA } from "xapi.js";
import "./commands/index.js";
import { CONFIG_WB } from "./config.js";
import { FillFloor } from "./modules/builders/FillBuilder.js";
import { Shape } from "./modules/builders/ShapeBuilder.js";
import { WorldEditBuild } from "./modules/builders/WorldEditBuilder.js";
import { SHAPES } from "./modules/utils/shapes.js";
import { setblock } from "./modules/utils/utils.js";
const GetPlayerSettings = XA.PlayerOptions("wb", {
    noBrushParticles: { desc: "Отключает партиклы у кисти", value: false },
    enableMobile: { desc: "Включает мобильное управление", value: false },
});
/* It's a code that replaces the block with a random block from the lore of the item. */
world.events.blockPlace.subscribe((data) => {
    if (data.block.typeId !== "minecraft:warped_nylium")
        return;
    const blocks = XA.Entity.getHeldItem(data.player).getLore();
    if (blocks.length < 1)
        return;
    const location = data.block.location;
    const block = blocks[~~(Math.random() * blocks.length)];
    setblock(block, location);
});
setPlayerInterval((p) => {
    const i = XA.Entity.getHeldItem(p);
    const settings = GetPlayerSettings(p);
    const lore = i?.getLore() ?? [];
    if (i?.typeId === "we:s" &&
        settings.enableMobile &&
        p.hasTag("using_item")) {
        if (lore[4] && lore[0] === "§aActive") {
            const block = lore[1].split(" ")[1];
            const data = lore[1].split(" ")[2];
            const H = lore[3].split(" ")[1];
            const R = lore[3].split(" ")[3];
            const Z = lore[4].split(" ")[1].replace("+", "");
            const O = lore[4].split(" ")[3];
            if (lore[0] == "§aActive")
                p.runCommandAsync(`fill ~-${R} ~${Z}${H} ~-${R} ~${R} ~${Z}${O} ~${R} ${block} ${data}`);
        }
    }
    if (i?.typeId === "we:brush" && !settings.noBrushParticles) {
        /** @type {import("@minecraft/server").BlockRaycastOptions} */
        const q = {};
        const range = lore[3]?.replace("Range: ", "");
        if (range) {
            q.maxDistance = parseInt(range);
            const block = p.getBlockFromViewDirection(q);
            if (block) {
                const ent1 = XA.Entity.getEntityAtPos(block.location.x, block.location.y, block.location.z);
                if (!ent1) {
                    XA.runCommandX(`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
                    XA.runCommandX(`summon f:t ${block.location.x} ${block.location.y - CONFIG_WB.H} ${block.location.z} spawn "${CONFIG_WB.BRUSH_LOCATOR}"`);
                    XA.runCommandX(`tag @e[x=${block.location.x},y=${block.location.y - CONFIG_WB.H},z=${block.location.z},r=1,type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}"] add "${p.name}"`);
                }
                for (let ent of ent1) {
                    if (ent.id == "f:t" && ent.nameTag == CONFIG_WB.BRUSH_LOCATOR)
                        break;
                    XA.runCommandX(`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
                    XA.runCommandX(`summon f:t ${block.location.x} ${block.location.y - CONFIG_WB.H} ${block.location.z} spawn "${CONFIG_WB.BRUSH_LOCATOR}"`);
                    XA.runCommandX(`tag @e[x=${block.location.x},y=${block.location.y - CONFIG_WB.H},z=${block.location.z},r=1,type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}"] add "${p.name}"`);
                    break;
                }
            }
        }
    }
    else {
        XA.runCommandX(`event entity @e[type=f:t,name="${CONFIG_WB.BRUSH_LOCATOR}",tag="${p.name}"] kill`);
    }
    if (i?.typeId === "we:s" && lore[4] && lore[0] === "§9Adv") {
        const B = lore[1].split(" ")[1].split(",");
        const RB = lore[2]?.split(" ")[1];
        const R = Number(lore[3].split(" ")[3]);
        if (R < 2)
            return;
        const Z = lore[4].split(" ")[1].replace("+", "");
        const H = Number(`${Z}${lore[3].split(" ")[1]}`);
        const O = Number(`${Z}${lore[4].split(" ")[3]}`);
        const newloc = XA.Utils.floorVector(p.location);
        newloc.offset(-R, H, -R);
        newloc.offset(R, O, R);
        FillFloor(newloc.offset(-R, H, -R), newloc.offset(R, O, R), B, RB ?? "any");
    }
}, 10, "WB Main");
setPlayerInterval((p) => {
    const i = XA.Entity.getHeldItem(p);
    if (!p.hasTag("attacking") || i?.typeId !== "we:brush")
        return;
    const lore = i.getLore();
    const shape = lore[0]?.replace("Shape: ", "");
    const blocks = lore[1]?.replace("Blocks: ", "").split(",");
    const size = lore[2]?.replace("Size: ", "");
    const range = lore[3]?.replace("Range: ", "");
    if (!shape || !blocks || !size || !range)
        return;
    const block = p.getBlockFromViewDirection({ maxDistance: parseInt(range) });
    if (block)
        new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
}, 5, "WB Brush");
setTickInterval(() => {
    WorldEditBuild.drawSelection();
}, 20, "WB Selection");
world.events.beforeItemUseOn.subscribe((data) => {
    const blockLocation = data.getBlockLocation();
    if (data.item.typeId !== "we:wand" || !(data.source instanceof Player))
        return;
    const pos = WorldEditBuild.pos2 ?? { x: 0, y: 0, z: 0 };
    if (pos.x === blockLocation.x &&
        pos.y === blockLocation.y &&
        pos.z === blockLocation.z)
        return;
    WorldEditBuild.pos2 = blockLocation;
    data.source.tell(`§d►2◄§f (use) ${blockLocation.x}, ${blockLocation.y}, ${blockLocation.z}` //§r
    );
});
world.events.beforeItemUse.subscribe((data) => {
    if (!(data.source instanceof Player))
        return;
    if (data.item.typeId === "we:s") {
        let lore = data.item.getLore();
        let q = true;
        switch (lore[0]) {
            case "§Active":
                if (!q)
                    break;
                lore[0] = "§cDisactive";
                q = false;
                break;
            case "§cDisactive":
                if (!q)
                    break;
                lore[0] = "§aActive";
                q = false;
                break;
            case "§9Adv":
                if (!q)
                    break;
                lore[0] = "§cAdv";
                q = false;
                break;
            case "§cAdv":
                if (!q)
                    break;
                lore[0] = "§9Adv";
                q = false;
                break;
        }
        const item = data.item;
        item.setLore(lore);
        XA.Entity.getI(data.source).setItem(data.source.selectedSlot, item);
    }
    if (data.item.typeId != "we:brush")
        return;
    const sett = GetPlayerSettings(data.source);
    if (sett.enableMobile)
        return;
    const lore = data.item.getLore();
    const shape = lore[0]?.replace("Shape: ", "");
    const blocks = lore[1]?.replace("Blocks: ", "").split(",");
    const size = lore[2]?.replace("Size: ", "");
    const range = lore[3]?.replace("Range: ", "");
    if (!shape || !blocks || !size || !range)
        return;
    /** @type {import("@minecraft/server").BlockRaycastOptions} */
    const q = {};
    q.maxDistance = parseInt(range);
    const block = data.source.getBlockFromViewDirection(q);
    if (block)
        new Shape(SHAPES[shape], block.location, blocks, parseInt(size));
});
world.events.itemUse.subscribe((data) => {
    if (data.item.typeId.startsWith("l:")) {
        data.source.runCommandAsync(`tp ^^^5`);
    }
});
world.events.blockBreak.subscribe((data) => {
    if (XA.Entity.getHeldItem(data.player)?.typeId !== "we:wand")
        return;
    const pos = WorldEditBuild.pos1 ?? { x: 0, y: 0, z: 0 };
    if (pos.x === data.block.location.x &&
        pos.y === data.block.location.y &&
        pos.z === data.block.location.z)
        return;
    WorldEditBuild.pos1 = data.block.location;
    data.player.tell(`§5►1◄§r (break) ${data.block.location.x}, ${data.block.location.y}, ${data.block.location.z}`);
    data.dimension
        .getBlock(data.block.location)
        .setPermutation(data.brokenBlockPermutation);
});
