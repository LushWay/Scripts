import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'hpos1',
  description: 'Установить позицию точки 1 из взгляда (ломать)',
  role: 'builder',
}).executes(ctx => {
  const pos = ctx.sender.getBlockFromViewDirection()
  if (!pos) return ctx.error('Нет блока')

  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos1 = pos.block.location
})
