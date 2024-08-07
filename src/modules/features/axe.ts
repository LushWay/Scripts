import { world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Region, ms } from 'lib'
import { isBuilding } from 'lib/game-utils'
import { actionGuard } from 'lib/region/index'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

export class Axe {
  static breaks: string[] = Object.entries(MinecraftBlockTypes)
    .filter(e => /log/i.exec(e[0]))
    .map(e => e[1])

  static allowBreakInRegions: Region[] = []
}

actionGuard((_, region, ctx) => {
  if (
    ctx.type === 'break' &&
    // ctx.event.itemStack?.typeId.endsWith('axe') &&
    Axe.breaks.includes(ctx.event.block.typeId)
  ) {
    if (region) {
      if (Axe.allowBreakInRegions.includes(region)) return true
    } else return true
  }
})

world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation: broken, dimension, player }) => {
  if (!Axe.breaks.includes(broken.type.id)) return
  if (isBuilding(player)) return
  // block.setType(broken.type.id.replace(/stripped_/, '').replace(/_log$/, '_fence'))

  scheduleBlockPlace({
    dimension: dimension.type,
    location: block.location,
    typeId: broken.type.id,
    states: broken.getAllStates(),
    restoreTime: ms.from('min', 1),
  })
})
