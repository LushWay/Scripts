import { WEBUILD } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'desel',
  description: 'Выключает отрисовку текущего выделения',
  role: 'moderator',
}).executes(ctx => {
  WEBUILD.pos1 = WEBUILD.pos2 = { x: 0, z: 0, y: 0 }
  ctx.reply(`§3► §fОчищено.`)
})
