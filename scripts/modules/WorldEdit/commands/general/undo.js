import { WorldEdit } from '../../lib/WorldEdit.js'

new Command('undo')
  .setGroup('we')
  .setDescription('Отменяет последнее действие (из памяти)')
  .setPermissions('builder')
  .int('undoCount', true)
  .executes((ctx, r) => {
    WorldEdit.forPlayer(ctx.player).undo(!isNaN(r) ? r : 1)
  })
