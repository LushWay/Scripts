import { WorldEdit } from '../../lib/WorldEdit.js'

new Command({
  name: 'copy',
  description: 'Копирует зону',
  role: 'builder',
  type: 'we',
}).executes(ctx => {
  WorldEdit.forPlayer(ctx.sender).copy()
})
