import { world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Region, ms } from 'lib'
import { isBuilding } from 'lib/game-utils'
import { actionGuard, ActionGuardOrder } from 'lib/region/index'
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
    region &&
    Axe.allowBreakInRegions.includes(region) &&
    Axe.breaks.includes(ctx.event.block.typeId)
  ) {
    return true
  }
}, ActionGuardOrder.Permission)

world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation: broken, dimension, player }) => {
  if (!Axe.breaks.includes(broken.type.id)) return
  if (isBuilding(player)) return

  scheduleBlockPlace({
    dimension: dimension.type,
    location: block.location,
    typeId: broken.type.id,
    states: broken.getAllStates(),
    restoreTime: ms.from('min', 1),
  })
})
