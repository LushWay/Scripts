import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit.js'

new Command('pos1')
  .setDescription('Устанавливает позицию 1 (ломать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.player).pos1 = Vector.floor(pos)
  })
