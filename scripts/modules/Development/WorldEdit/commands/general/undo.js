import { WorldEdit } from '../../class/WorldEdit.js'

new XCommand({
  type: 'we',
  name: 'undo',
  description: 'Отменяет последнее действие (из памяти)',
  role: 'moderator',
})
  .int('undoCount', true)
  .executes((ctx, r) => {
    const we = WorldEdit.forPlayer(ctx.sender)

    const status = we.undo(!isNaN(r) ? r : 1)
    ctx.reply(status)
  })
