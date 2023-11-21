import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  name: 'pos2',
  description: 'Устанавливает позицию 2 (использовать)',
  role: 'moderator',
})
  .location('pos', true)
  .executes((ctx, pos) => {
    const we = WorldEdit.forPlayer(ctx.sender)

    pos = Vector.floor(pos)
    we.pos2 = pos
    ctx.reply(`§d►§r (2) ${Vector.string(pos)}`)
  })
