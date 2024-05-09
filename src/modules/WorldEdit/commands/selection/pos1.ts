import { Vector } from '@minecraft/server'
import { WorldEdit } from '../../lib/WorldEdit'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('pos1')
  .setDescription('Устанавливает позицию 1 (ломать)')
  .setPermissions('builder')
  .location('pos', true)
  .executes((ctx, pos) => {
    WorldEdit.forPlayer(ctx.player).pos1 = Vector.floor(pos)
  })
