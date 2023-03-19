import { Entity } from "@minecraft/server";
import { IS, XA } from "xapi.js";
import { WorldEditBuild } from "../../modules/builders/WorldEditBuilder.js";
/**
 * Get the current chunk of a entity
 * @param {Entity} entity entity to check
 * @returns {Object}
 * @example getCurrentChunk(Entity);
 */
function getCurrentChunk(entity) {
    return {
        x: Math.floor(entity.location.x / 16),
        z: Math.floor(entity.location.z / 16),
    };
}
/**
 * Gets the cuboid positions of a entitys chunk
 * @param {Entity} entity entity to check
 * @example getChunkCuboidPositions(Entity);
 */
function getChunkCuboidPositions(entity) {
    const chunk = getCurrentChunk(entity);
    const pos1 = { x: chunk.x * 16, y: -63, z: chunk.z * 16 };
    const pos2 = pos1.offset(16, 383, 16);
    return {
        pos1: pos1,
        pos2: pos2,
    };
}
new XA.Command({
    type: "wb",
    name: "chunk",
    description: "Set the selection to your current chunk.",
    requires: (p) => IS(p.id, "moderator"),
}).executes((ctx) => {
    const chunkBorder = getChunkCuboidPositions(ctx.sender);
    WorldEditBuild.pos1 = chunkBorder.pos1;
    WorldEditBuild.pos2 = chunkBorder.pos2;
    ctx.reply(`§b►§3Выделенна зона: §5Позиция 1§3: ${chunkBorder.pos1.x} ${chunkBorder.pos1.y} ${chunkBorder.pos1.z}, §dПозиция 2§3: ${chunkBorder.pos2.x} ${chunkBorder.pos2.y} ${chunkBorder.pos2.z}`);
});
