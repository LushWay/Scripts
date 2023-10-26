import { Vector } from '@minecraft/server'
import { WorldEditBuild } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'size',
  description: 'Получет информация о выделенной зоне',
  role: 'moderator',
}).executes(ctx => {
  if (!WorldEditBuild.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  ctx.reply(
    `§3В выделенной зоне §f${Vector.size(
      WorldEditBuild.pos1,
      WorldEditBuild.pos2
    )}§3 блоков`
  )
})
