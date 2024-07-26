import { system } from '@minecraft/server'
import { actionGuard, isNotPlaying, ms } from 'lib'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'
import { ores, placeOre } from './algo'
import { MineshaftRegion } from './mineshaft-region'
// TODO Если в регионе шахты не остается ни одного отлложенно-поставленного блока, регион шахты должен загрузить сохраненную структуру

actionGuard((player, region, ctx) => {
  if (isNotPlaying(player)) return
  if (!(region instanceof MineshaftRegion)) return

  switch (ctx.type) {
    case 'interactWithBlock':
    case 'interactWithEntity':
      return true

    case 'break': {
      const { block, dimension } = ctx.event
      const ore = ores.getOre(block.typeId)

      const typeId = block.typeId
      system.delay(() => placeOre(block, typeId, dimension, player))

      scheduleBlockPlace({
        dimension: dimension.type,
        location: block.location,
        restoreTime: ms.from('min', Math.randomInt(1, 3)),
        typeId: ore ? ore.empty : block.typeId,
        states: ore ? undefined : block.permutation.getAllStates(),
      })

      return true
    }

    case 'place': {
      const { block, dimension } = ctx.event
      scheduleBlockPlace({
        dimension: dimension.type,
        location: block.location,
        restoreTime: ms.from('min', Math.randomInt(3, 10)),
        typeId: block.typeId,
        states: block.permutation.getAllStates(),
      })

      return true
    }
  }
})
