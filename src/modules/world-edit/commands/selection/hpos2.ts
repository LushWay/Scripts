import { WorldEdit } from '../../lib/world-edit'

new Command('hpos2')
  .setGroup('we')
  .setDescription('Установить позицию точки 2 из взгляда (использовать)')
  .setPermissions('builder')
  .executes(ctx => {
    const pos = ctx.player.getBlockFromViewDirection()
    if (!pos) return ctx.error('Нет блока')

    const we = WorldEdit.forPlayer(ctx.player)
    we.pos2 = pos.block.location
  })
