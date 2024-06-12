import { system } from '@minecraft/server'
import { MineshaftRegion, actionGuard, util } from 'lib'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'
import { ores, placeOre } from './algo'

actionGuard((player, region, ctx) => {
  if (!(region instanceof MineshaftRegion)) return
  if (ctx.type === 'interactWithBlock' || ctx.type === 'interactWithEntity') {
    return true
  } else if (ctx.type === 'break') {
    const { block, dimension } = ctx.event
    const ore = ores.getOre(block.typeId)

    system.delay(() => {
      placeOre(block, dimension)
    })

    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      restoreTime: util.ms.from('min', Math.randomInt(1, 3)),
      typeId: ore ? ore.stone : block.type.id,
      states: ore ? undefined : block.permutation.getAllStates(),
    })

    return true
  } else {
    const { block, dimension } = ctx.event
    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      restoreTime: util.ms.from('min', Math.randomInt(3, 10)),
      typeId: block.typeId,
      states: block.permutation.getAllStates(),
    })
    return true
  }
})
