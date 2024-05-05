import { WorldEdit } from '../../lib/WorldEdit.js'

new Command('copy')
  .setDescription('Копирует зону')
  .setPermissions('builder')
  .setGroup('we')
  .executes(ctx => {
    WorldEdit.forPlayer(ctx.player).copy()
  })
