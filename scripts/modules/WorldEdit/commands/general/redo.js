import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'redo',
  description: 'Возвращает последнее действие (из памяти)',
  role: 'builder',
})
  .int('redoCount', true)
  .executes((ctx, r) => {
    const we = WorldEdit.forPlayer(ctx.sender)

    const status = we.redo(!isNaN(r) ? r : 1)
    if (status) ctx.reply(status)
  })
