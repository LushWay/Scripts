import { WorldEdit } from '../../lib/world-edit'

new Command('hpos1')
  .setGroup('we')
  .setDescription('Установить позицию точки 1 из взгляда (ломать)')
  .setPermissions('builder')
  .executes(ctx => {
    const pos = ctx.player.getBlockFromViewDirection()
    if (!pos) return ctx.error('Нет блока')

    const we = WorldEdit.forPlayer(ctx.player)
    we.pos1 = pos.block.location
  })
