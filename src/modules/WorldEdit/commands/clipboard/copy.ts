import { WorldEdit } from '../../lib/WorldEdit'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('copy')
  .setDescription('Копирует зону')
  .setPermissions('builder')
  .setGroup('we')
  .executes(ctx => {
    WorldEdit.forPlayer(ctx.player).copy()
  })
