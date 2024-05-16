import {} from '@minecraft/server'
import { Vector } from 'lib'
import { WorldEdit } from '../../lib/WorldEdit'

new Command('pos2')
  .setDescription('Устанавливает позицию 2 (использовать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.player).pos2 = Vector.floor(pos)
  })
