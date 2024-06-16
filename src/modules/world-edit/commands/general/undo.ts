import { WorldEdit } from '../../lib/world-edit'

new Command('undo')
  .setGroup('we')
  .setDescription('Отменяет последнее действие (из памяти)')
  .setPermissions('builder')
  .int('count', true)
  .executes((ctx, count = 1) => {
    WorldEdit.forPlayer(ctx.player).undo(count)
  })
