import { Vector } from '@minecraft/server'
import { WorldEdit } from 'modules/world-edit/lib/WorldEdit'

new Command('size')
  .setGroup('we')
  .setDescription('Размер выделенной зоны')
  .setPermissions('builder')
  .executes(ctx => {
    const we = WorldEdit.forPlayer(ctx.player)
    if (!we.selection) return ctx.reply('§cЗона не выделена!')

    ctx.reply(`§3В выделенной зоне §f${Vector.size(we.pos1, we.pos2)}§3 блоков`)
  })
