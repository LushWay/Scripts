import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  type: 'we',
  name: 'hpos2',
  description: 'Установить позицию точки 2 из взгляда (использовать)',
  role: 'builder',
}).executes(ctx => {
  const pos = ctx.sender.getBlockFromViewDirection()
  if (!pos) return ctx.error('Нет блока')

  const we = WorldEdit.forPlayer(ctx.sender)
  we.pos2 = pos.block.location
})
