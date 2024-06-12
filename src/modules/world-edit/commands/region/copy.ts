import { WorldEdit } from '../../lib/world-edit'

new Command('copy')
  .setDescription('Копирует зону')
  .setPermissions('builder')
  .setGroup('we')
  .executes(ctx => {
    WorldEdit.forPlayer(ctx.player).copy()
  })
