import { world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { isBuilding } from 'modules/Build/list.js'
import { actionGuard } from 'modules/Survival/guard.js'
import { scheduleBlockPlace } from 'modules/Survival/utils/scheduledBlockPlace.js'
import { Region, util } from 'smapi.js'

export const AXE = {
  /** @type {string[]} */
  BREAKS: Object.entries(MinecraftBlockTypes)
    .filter(e => e[0].match(/log/i))
    .map(e => e[1]),

  /**
   * @type {Region[]}
   */
  ALLOW_BREAK_IN_REGIONS: [],
}

actionGuard((_, region, ctx) => {
  if (
    ctx.type === 'break' &&
    // ctx.event.itemStack?.typeId.endsWith('axe') &&
    AXE.BREAKS.includes(ctx.event.block.typeId)
  ) {
    if (region) {
      if (AXE.ALLOW_BREAK_IN_REGIONS.includes(region)) return true
    } else return true
  }
})

world.afterEvents.playerBreakBlock.subscribe(({ block, brokenBlockPermutation: broken, dimension, player }) => {
  if (AXE.BREAKS.includes(broken.type.id)) {
    if (isBuilding(player)) return
    block.setType(broken.type.id.replace(/stripped_/, '').replace(/_log$/, '_fence'))

    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: broken.type.id,
      states: broken.getAllStates(),
      restoreTime: util.ms.from('min', 10),
    })
  }
})
