import { WorldEditBuild } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'desel',
  description: 'Выключает отрисовку текущего выделения',
  role: 'moderator',
}).executes(ctx => {
  WorldEditBuild.pos1 = WorldEditBuild.pos2 = { x: 0, z: 0, y: 0 }
  ctx.reply(`§3► §fОчищено.`)
})
