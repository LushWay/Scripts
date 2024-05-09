import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('pos2')
  .setDescription('Устанавливает позицию 2 (использовать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.player).pos2 = Vector.floor(pos)
  })
