import { Entity, Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit.js'

/**
 * Gets the cuboid positions of a entitys chunk
 *
 * @example
 *   getChunkCuboidPositions(Entity)
 *
 * @param {Entity} entity Entity to check
 */
function getChunkCuboidPositions(entity) {
  const chunk = {
    x: Math.floor(entity.location.x / 16),
    z: Math.floor(entity.location.z / 16),
  }
  const pos1 = { x: chunk.x * 16, y: -63, z: chunk.z * 16 }
  const pos2 = Vector.add(pos1, new Vector(16, 383, 16))
  return {
    pos1: pos1,
    pos2: pos2,
  }
}

new Command('chunk')
  .setGroup('we')
  .setDescription('Выбрать чанк')
  .setPermissions('builder')
  .executes(ctx => {
    const we = WorldEdit.forPlayer(ctx.player)
    const chunkBorder = getChunkCuboidPositions(ctx.player)
    we.pos1 = chunkBorder.pos1
    we.pos2 = chunkBorder.pos2
    ctx.reply(
      `§b►§3Выделенна зона: §5Позиция 1§3: ${Vector.string(chunkBorder.pos1, true)}, §dПозиция 2§3: ${Vector.string(
        chunkBorder.pos2,
        true,
      )}`,
    )
  })
