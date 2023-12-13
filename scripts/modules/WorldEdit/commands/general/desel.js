import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'desel',
  description: 'Выключает отрисовку текущего выделения',
  role: 'builder',
}).executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos1 = we.pos2 = { x: 0, z: 0, y: 0 }
  ctx.reply(`§3► §fОчищено.`)
})
