import { Vector } from '@minecraft/server'
import { WorldEdit } from 'modules/WorldEdit/class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'size',
  description: 'Размер выделенной зоны',
  role: 'builder',
}).executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')

  ctx.reply(`§3В выделенной зоне §f${Vector.size(we.pos1, we.pos2)}§3 блоков`)
})
