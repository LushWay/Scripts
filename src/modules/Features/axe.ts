import { world } from '@minecraft/server'

import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Region, util } from 'lib'
import { actionGuard } from 'lib/Region/index'
import { scheduleBlockPlace } from 'modules/Survival/scheduledBlockPlace'
import { isBuilding } from 'modules/WorldEdit/isBuilding'

export class Axe {
  /** @type {string[]} */
  static breaks = Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1])

  /** @type {Region[]} */
  static allowBreakInRegions = []
}

// @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
actionGuard((_, region, ctx) => {
  if (
    ctx.type === 'break' &&
    // ctx.event.itemStack?.typeId.endsWith('axe') &&
    Axe.breaks.includes(ctx.event.block.typeId)
  ) {
    if (region) {
      // @ts-expect-error TS(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
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
    restoreTime: util.ms.from('min', 1),
  })

  player.container
  player.getComponent('inventory')?.container
})
