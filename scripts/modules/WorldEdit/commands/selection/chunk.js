import { Entity, Vector } from '@minecraft/server'
import { Command } from 'smapi.js'
import { WorldEdit } from '../../class/WorldEdit.js'

/**
 * Gets the cuboid positions of a entitys chunk
 * @param {Entity} entity entity to check
 * @example getChunkCuboidPositions(Entity);
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

new Command({
  type: 'we',
  name: 'chunk',
  description: 'Set the selection to your current chunk.',
  role: 'moderator',
}).executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  const chunkBorder = getChunkCuboidPositions(ctx.sender)
  we.pos1 = chunkBorder.pos1
  we.pos2 = chunkBorder.pos2
  ctx.reply(
    `§b►§3Выделенна зона: §5Позиция 1§3: ${Vector.string(
      chunkBorder.pos1
    )}, §dПозиция 2§3: ${Vector.string(chunkBorder.pos2)}`
  )
})
