import { world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { Region, util } from 'lib.js'
import { actionGuard } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/isBuilding'
import { scheduleBlockPlace } from 'modules/Survival/scheduledBlockPlace.js'

export class Axe {
  /** @type {string[]} */
  static breaks = Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1])

  /**
   * @type {Region[]}
   */
  static allowBreakInRegions = []
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
  if (Axe.breaks.includes(broken.type.id)) {
    if (isBuilding(player)) return
    // block.setType(broken.type.id.replace(/stripped_/, '').replace(/_log$/, '_fence'))

    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: broken.type.id,
      states: broken.getAllStates(),
      restoreTime: util.ms.from('min', 1),
    })
  }
})
