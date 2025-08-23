import {} from '@minecraft/server'
import { Vec } from 'lib'
import { WorldEdit } from '../../lib/world-edit'

new Command('pos2')
  .setDescription('Устанавливает позицию 2 (использовать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos = ctx.player.location) => {
    WorldEdit.forPlayer(ctx.player).pos2 = Vec.floor(pos)
  })
