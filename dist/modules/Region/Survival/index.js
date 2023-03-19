import { Entity, Player, world } from "@minecraft/server";
import { setTickInterval, setTickTimeout } from "xapi.js";
import { DIMENSIONS } from "../../../lib/List/dimensions.js";
import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "../utils/config.js";
import { CONTAINER_LOCATIONS, locationToKey } from "../utils/container.js";
import { Region } from "../utils/Region.js";
import { InRaid } from "../var.js";
/**
 *
 * @param {Player | Entity} player
 * @param {Region} region
 */
function allowed(player, region) {
    return (player.hasTag("modding") || region.permissions.owners.includes(player.id));
}
/**
 * Permissions for region
 */
world.events.beforeItemUseOn.subscribe((data) => {
    const region = Region.blockLocationInRegion(data.blockLocation, data.source.dimension.id);
    if (!region || allowed(data.source, region))
        return;
    const block = data.source.dimension.getBlock(data.blockLocation);
    if (DOORS_SWITCHES.includes(block.typeId) &&
        region.permissions.doorsAndSwitches)
        return;
    if (BLOCK_CONTAINERS.includes(block.typeId) &&
        region.permissions.openContainers)
        return;
    data.cancel = true;
});
/**
 * Permissions for region
 */
world.events.blockPlace.subscribe((data) => {
    const region = Region.blockLocationInRegion(data.block.location, data.player.dimension.id);
    if (!region || allowed(data.player, region))
        return;
    const l = data.block.location;
    data.dimension.runCommandAsync(`setblock ${l.x} ${l.y} ${l.z} air 0 destroy`);
});
/**
 * Permissions for region
 */
world.events.blockBreak.subscribe(({ player, block, brokenBlockPermutation, dimension }) => {
    const region = Region.blockLocationInRegion(block.location, player.dimension.id);
    if (!region || allowed(player, region))
        return;
    // setting block back
    dimension
        .getBlock(block.location)
        .setPermutation(brokenBlockPermutation.clone());
    // setting chest inventory back
    if (BLOCK_CONTAINERS.includes(brokenBlockPermutation.type.id)) {
        const OLD_INVENTORY = CONTAINER_LOCATIONS[locationToKey(block.location)];
        if (OLD_INVENTORY) {
            OLD_INVENTORY.load(block.getComponent("inventory").container);
        }
    }
    // killing dropped items
    setTickTimeout(() => {
        [
            ...dimension.getEntities({
                maxDistance: 2,
                type: "minecraft:item",
                location: {
                    x: block.location.x,
                    y: block.location.y,
                    z: block.location.z,
                },
            }),
        ].forEach((e) => e.kill());
    }, 0, "asd");
});
world.events.beforeExplosion.subscribe((data) => {
    for (const bl of data.getImpactedBlocks()) {
        let region = Region.blockLocationInRegion(bl, data.dimension.id);
        if (region && !region.permissions.pvp)
            return (data.cancel = true);
        for (const id of region.permissions.owners)
            InRaid[id] = 60;
    }
});
world.events.entitySpawn.subscribe((data) => {
    const region = Region.blockLocationInRegion({
        x: data.entity.location.x,
        y: data.entity.location.y,
        z: data.entity.location.z,
    }, data.entity.dimension.id);
    if (!region)
        return;
    if (region.permissions.allowedEntitys.includes(data.entity.typeId))
        return;
    data.entity.teleport({ x: 0, y: -64, z: 0 }, data.entity.dimension, 0, 0);
    data.entity.kill();
});
setTickInterval(() => {
    for (const region of Region.getAllRegions()) {
        for (const entity of DIMENSIONS[region.dimensionId].getEntities({
            excludeTypes: region.permissions.allowedEntitys,
        })) {
            if (!region.entityInRegion(entity))
                continue;
            entity.teleport({ x: 0, y: -64, z: 0 }, entity.dimension, 0, 0);
            entity.kill();
        }
    }
}, 100, "regEntClear");
