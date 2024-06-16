import { WorldEdit } from '../../lib/world-edit'

new Command('redo')
  .setGroup('we')
  .setDescription('Возвращает последнее действие (из памяти)')
  .setPermissions('builder')
  .int('count', true)
  .executes((ctx, count = 1) => {
    WorldEdit.forPlayer(ctx.player).redo(count)
  })
