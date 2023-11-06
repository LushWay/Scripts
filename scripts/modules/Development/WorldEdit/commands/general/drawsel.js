import { WEBUILD } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'drawsel',
  description: 'Переключает отрисовку текущего выделения',
  role: 'moderator',
}).executes(ctx => {
  WEBUILD.drawselection = !WEBUILD.drawselection
  ctx.reply(
    `§3► §fОтображение выделения: ${
      WEBUILD.drawselection ? '§aвключено' : '§cвыключено'
    }`
  )
})
