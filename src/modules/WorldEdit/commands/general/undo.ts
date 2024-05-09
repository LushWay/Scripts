import { WorldEdit } from '../../lib/WorldEdit'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('undo')
  .setGroup('we')
  .setDescription('Отменяет последнее действие (из памяти)')
  .setPermissions('builder')
  .int('undoCount', true)
  .executes((ctx, r) => {
    WorldEdit.forPlayer(ctx.player).undo(!isNaN(r) ? r : 1)
  })
