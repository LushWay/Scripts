import { Vector, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { INTERACTION_GUARD } from 'modules/Survival/config.js'
import { DELAYED_BLOCK_PLACE_DB } from 'modules/Survival/utils/breakRestore.js'
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

INTERACTION_GUARD.subscribe((_, region, ctx) => {
  if (
    ctx.type === 'break' &&
    ctx.event.itemStack?.typeId.endsWith('axe') &&
    AXE.BREAKS.includes(ctx.event.block.typeId)
  ) {
    if (region) {
      if (AXE.ALLOW_BREAK_IN_REGIONS.includes(region)) return true
    } else return true
  }
})

world.afterEvents.playerBreakBlock.subscribe(event => {
  if (AXE.BREAKS.includes(event.brokenBlockPermutation.type.id)) {
    event.block.setType(event.brokenBlockPermutation.type.id.replace(/^stripped_/, '').replace(/_log$/, '_fence'))
    DELAYED_BLOCK_PLACE_DB[Vector.string(event.block.location)] = {
      typeId: event.brokenBlockPermutation.type.id,
      date: Date.now() + util.ms.from('min', 10),
    }
  }
})
