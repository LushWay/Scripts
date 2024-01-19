import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'undo',
  description: 'Отменяет последнее действие (из памяти)',
  role: 'builder',
})
  .int('undoCount', true)
  .executes((ctx, r) => {
    WorldEdit.forPlayer(ctx.sender).undo(!isNaN(r) ? r : 1)
  })
