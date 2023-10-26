import { Vector } from '@minecraft/server'
import { WorldEditBuild } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'hpos1',
  description: 'Set position 1 to targeted block',
  role: 'moderator',
}).executes(ctx => {
  const pos = ctx.sender.getBlockFromViewDirection()
  if (!pos) return ctx.reply('Неа!')

  WorldEditBuild.pos1 = pos.block.location
  ctx.reply(`§5Позиция§r 1 теперь ${Vector.string(WorldEditBuild.pos1)}`)
})
