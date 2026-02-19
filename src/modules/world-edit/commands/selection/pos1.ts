import {} from '@minecraft/server'
import { Vec } from 'lib/vector'
import { WorldEdit } from '../../lib/world-edit'

new Command('pos1')
  .setDescription('Устанавливает позицию 1 (ломать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos = ctx.player.location) => {
    WorldEdit.forPlayer(ctx.player).pos1 = Vec.floor(pos)
  })
