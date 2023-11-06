import { Vector } from '@minecraft/server'
import { WEBUILD } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'size',
  description: 'Получет информация о выделенной зоне',
  role: 'moderator',
}).executes(ctx => {
  if (!WEBUILD.selectionCuboid) return ctx.reply('§cЗона не выделена!')
  ctx.reply(
    `§3В выделенной зоне §f${Vector.size(WEBUILD.pos1, WEBUILD.pos2)}§3 блоков`
  )
})
