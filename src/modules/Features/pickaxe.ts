import { MineshaftRegion, actionGuard } from 'lib/Region/index'

// @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
actionGuard((player, region, ctx) => {
  if (ctx.type !== 'break') return
  if (!ctx.event.itemStack?.typeId?.endsWith('pickaxe')) return
  if (!(region instanceof MineshaftRegion)) return

  return true
})
