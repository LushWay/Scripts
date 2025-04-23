import { Player, PlayerBreakBlockBeforeEvent, system } from '@minecraft/server'
import { ActionForm, ms, registerCreateableRegion } from 'lib'
import { registerSaveableRegion } from 'lib/region/database'
import { scheduleBlockPlace } from 'lib/scheduled-block-place'
import { t } from 'lib/text'
import { createLogger } from 'lib/utils/logger'
import { MineareaRegion } from '../minearea/minearea-region'
import { ores, placeOre } from './algo'

const logger = createLogger('Shaft')

export class MineshaftRegion extends MineareaRegion {
  protected async onCreate() {
    await this.removeAllOresAndResaveStructure()
  }

  async removeAllOresAndResaveStructure() {
    let oresFound = 0
    const regionsRestored = await this.restoreAndResaveStructure(vector => {
      const block = this.dimension.getBlock(vector)
      const ore = block && ores.getOre(block.typeId)
      if (ore) {
        logger.info`Replacing ${block.typeId} at ${vector} with ${ore.empty}`
        block.setType(ore.empty)
        oresFound++
      }
    })

    logger.info`Created new mineshaft region. Ores found: ${oresFound}, crossregions restored: ${regionsRestored}`

    return { oresFound, regionsRestored }
  }

  onBlockBreak(player: Player, event: PlayerBreakBlockBeforeEvent) {
    const { block, dimension } = event
    const ore = ores.getOre(block.typeId)

    const typeId = block.typeId
    system.delay(() => placeOre(block, typeId, dimension, player))

    const schedule = scheduleBlockPlace({
      dimension: dimension.type,
      location: block.location,
      typeId: ore ? ore.empty : block.typeId,
      states: ore ? undefined : block.permutation.getAllStates(),
      restoreTime: ms.from('sec', Math.randomInt(30, 60)),
    })
    this.scheduledToPlaceBlocks.push(schedule)

    return true
  }

  get displayName() {
    return '§7Шахта'
  }

  customFormButtons(form: ActionForm, player: Player): void {
    form.addButton('Убрать все руды и сохранить структуру', () => {
      player.info('Start')
      this.removeAllOresAndResaveStructure()
        .then(e => player.info(t`End ${e}`))
        .catch((e: unknown) => player.fail(t.error`${e}`))
    })
  }
}

registerSaveableRegion('mine', MineshaftRegion)
registerCreateableRegion('Шахты', MineshaftRegion)
