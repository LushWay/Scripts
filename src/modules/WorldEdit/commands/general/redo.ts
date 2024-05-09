import { WorldEdit } from '../../lib/WorldEdit'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('redo')
  .setGroup('we')
  .setDescription('Возвращает последнее действие (из памяти)')
  .setPermissions('builder')
  .int('redoCount', true)
  .executes((ctx, r) => {
    WorldEdit.forPlayer(ctx.player).redo(!isNaN(r) ? r : 1)
  })
