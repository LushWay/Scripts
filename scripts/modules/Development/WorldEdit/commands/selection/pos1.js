import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../class/WorldEdit.js'

new XCommand({
  name: 'pos1',
  description: 'Устанавливает позицию 1 (ломать)',
  role: 'moderator',
})
  .location('pos', true)
  .executes((ctx, pos) => {
    const we = WorldEdit.forPlayer(ctx.sender)

    pos = Vector.floor(pos)
    we.pos1 = pos
    ctx.reply(`§5►§r (1) ${Vector.string(pos)}`)
  })
