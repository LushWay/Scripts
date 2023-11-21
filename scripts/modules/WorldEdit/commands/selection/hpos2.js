import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'hpos2',
  description: 'Set position 2 to targeted block',
  role: 'moderator',
}).executes(ctx => {
  const pos = ctx.sender.getBlockFromViewDirection()
  if (!pos) return ctx.error('Нет блока')

  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos2 = pos.block.location
  ctx.reply(`§dПозиция§r 2 теперь ${Vector.string(we.pos1)}`)
})
