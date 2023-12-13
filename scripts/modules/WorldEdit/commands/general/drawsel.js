import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'drawsel',
  description: 'Переключает отрисовку текущего выделения',
  role: 'builder',
}).executes(ctx => {
  const we = WorldEdit.forPlayer(ctx.sender)

  we.drawselection = !we.drawselection
  ctx.reply(
    `§3► §fОтображение выделения: ${
      we.drawselection ? '§aвключено' : '§cвыключено'
    }`
  )
})
