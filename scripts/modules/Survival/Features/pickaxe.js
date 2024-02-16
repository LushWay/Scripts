import { MineshaftRegion, actionGuard } from 'lib/Region/index.js'

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'break') return
  if (!ctx.event.itemStack?.typeId?.endsWith('pickaxe')) return
  if (!(region instanceof MineshaftRegion)) return

  return true
})
