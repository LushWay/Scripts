import { Player, PlayerBreakBlockBeforeEvent, system } from '@minecraft/server'
import { addAddableRegion, ms } from 'lib'
import { registerSaveableRegion } from 'lib/region/database'
import { scheduleBlockPlace } from 'modules/survival/scheduled-block-place'
import { MineareaRegion } from '../minearea/minearea-region'
import { ores, placeOre } from './algo'
import { createLogger } from 'lib/utils/logger'

const logger = createLogger('Shaft')

export class MineshaftRegion extends MineareaRegion {
  protected async onCreate() {
    let oresFound = 0
    const regionsRestored = await this.restoreAndSaveStructure(vector => {
      const block = this.dimension.getBlock(vector)
      const ore = block && ores.getOre(block.typeId)
      if (ore) {
        block.setType(ore.empty)
        oresFound++
      }
    })

    logger.info`Created new mineshaft region. Ores found: ${oresFound}, crossregions restored: ${regionsRestored}`
  }

  onBlockBreak(player: Player, event: PlayerBreakBlockBeforeEvent) {
    const { block, dimension } = event
    const ore = ores.getOre(block.typeId)

    const typeId = block.typeId
    system.delay(() => placeOre(block, typeId, dimension, player))

    scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: ore ? ore.empty : block.typeId,
      states: ore ? undefined : block.permutation.getAllStates(),
      restoreTime: ms.from('min', Math.randomInt(1, 3)),
    })

    return true
  }

  get displayName() {
    return '§7Шахта'
  }
}

addAddableRegion('Шахты', MineshaftRegion)
registerSaveableRegion('mine', MineshaftRegion)
