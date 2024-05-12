import { MineshaftRegion, actionGuard } from 'lib/region/index'

actionGuard((player, region, ctx) => {
  if (ctx.type !== 'break') return

  if (!ctx.event.itemStack?.typeId?.endsWith('pickaxe')) return
  if (!(region instanceof MineshaftRegion)) return

  return true
})
