import { WorldEdit } from '../../lib/WorldEdit.js'

new Command({
  type: 'we',
  name: 'redo',
  description: 'Возвращает последнее действие (из памяти)',
  role: 'builder',
})
  .int('redoCount', true)
  .executes((ctx, r) => {
    WorldEdit.forPlayer(ctx.sender).redo(!isNaN(r) ? r : 1)
  })
