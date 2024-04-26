import { WorldEdit } from '../../lib/WorldEdit.js'

new Command({
  type: 'we',
  name: 'desel',
  aliases: ['deselect', 'delselect', 'delsel'],
  description: 'Выключает отрисовку текущего выделения',
  role: 'builder',
}).executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos1 = { x: 0, z: 0, y: 0 }
  we.pos2 = { x: 0, z: 0, y: 0 }
  ctx.reply(`§3► §fОчищено.`)
})
