import { setTickInterval, getRole } from "xapi.js";
import { BlockLocation, world } from "@minecraft/server";

import { BLOCK_CONTAINERS, DOORS_SWITCHES } from "./config.js";
import { DIMENSIONS } from "../../lib/Class/D.js";
import { Region } from "./Region.js";
/**
 * Permissions for region
 */
world.events.beforeItemUseOn.subscribe((data) => {
  if (["moderator", "admin"].includes(getRole(data.source))) return;
  const region = Region.blockLocationInRegion(
    data.blockLocation,
    data.source.dimension.id
  );
  if (!region) return;
  const block = data.source.dimension.getBlock(data.blockLocation);
  if (
    DOORS_SWITCHES.includes(block.typeId) &&
    region.permissions.doorsAndSwitches
  )
    return;
  if (
    BLOCK_CONTAINERS.includes(block.typeId) &&
    region.permissions.openContainers
  )
    return;
  data.cancel = true;
});
world.events.beforeExplosion.subscribe((data) => {
  for (let i = 0; i < data.impactedBlocks.length; i++) {
    const bL = data.impactedBlocks[i];
    let region = Region.blockLocationInRegion(bL, data.dimension.id);
    if (region) return (data.cancel = true);
  }
});
world.events.entityCreate.subscribe((data) => {
  const region = Region.blockLocationInRegion(
    new BlockLocation(
      data.entity.location.x,
      data.entity.location.y,
      data.entity.location.z
    ),
    data.entity.dimension.id
  );
  if (!region) return;
  if (region.permissions.allowedEntitys.includes(data.entity.typeId)) return;
  data.entity.teleport({ x: 0, y: -64, z: 0 }, data.entity.dimension, 0, 0);
  data.entity.kill();
});
setTickInterval(() => {
  for (const region of Region.getAllRegions()) {
    for (const entity of DIMENSIONS[region.dimensionId].getEntities({
      excludeTypes: region.permissions.allowedEntitys,
    })) {
      if (!region.entityInRegion(entity)) continue;
      entity.teleport({ x: 0, y: -64, z: 0 }, entity.dimension, 0, 0);
      entity.kill();
    }
  }
}, 100);
