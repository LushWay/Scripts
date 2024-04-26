import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit.js'

new Command({
  name: 'pos1',
  description: 'Устанавливает позицию 1 (ломать)',
  role: 'builder',
})
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.sender).pos1 = Vector.floor(pos)
  })
