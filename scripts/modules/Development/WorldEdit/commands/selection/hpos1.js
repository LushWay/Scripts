import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../class/WorldEdit.js'

new XCommand({
  type: 'we',
  name: 'hpos1',
  description: 'Set position 1 to targeted block',
  role: 'moderator',
}).executes(ctx => {
  const pos = ctx.sender.getBlockFromViewDirection()
  if (!pos) return ctx.error('Нет блока')

  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos1 = pos.block.location
  ctx.reply(`§5Позиция§r 1 теперь ${Vector.string(we.pos1)}`)
})
