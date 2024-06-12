import {} from '@minecraft/server'
import { Vector } from 'lib'
import { WorldEdit } from '../../lib/world-edit'

new Command('pos1')
  .setDescription('Устанавливает позицию 1 (ломать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.player).pos1 = Vector.floor(pos)
  })
