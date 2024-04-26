import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit.js'

new Command({
  name: 'pos2',
  description: 'Устанавливает позицию 2 (использовать)',
  role: 'builder',
})
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.sender).pos2 = Vector.floor(pos)
  })
