import { LocationOutOfWorldBoundariesError, Player, PlayerBreakBlockBeforeEvent, system } from '@minecraft/server'
import { ActionForm, ms, registerRegionType, Vec } from 'lib'
import { i18n, noI18n } from 'lib/i18n/text'
import { registerSaveableRegion } from 'lib/region/database'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { createLogger } from 'lib/utils/logger'
import { MineareaRegion } from '../../../lib/region/kinds/minearea'
import { ores, placeOre } from './algo'

const logger = createLogger('Shaft')

export class MineshaftRegion extends MineareaRegion {
  protected async onCreate() {
    await this.removeAllOresAndResaveStructure()
  }

  async removeAllOresAndResaveStructure() {
    let oresFound = 0
    try {
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
    } catch (e) {
      if (e instanceof LocationOutOfWorldBoundariesError) {
        logger.info`Deleting cuz out of bounds ${this.id} ${this.area.toString()}`
        this.delete()
      }
    }
  }

  onBlockBreak(player: Player, event: PlayerBreakBlockBeforeEvent) {
    const { block, dimension } = event
    const ore = ores.getOre(block.typeId)

    const typeId = block.typeId
    system.delay(() => placeOre(block, typeId, dimension, player))

    const schedule = ScheduleBlockPlace.set({
      dimension: dimension.type,
      location: block.location,
      typeId: ore ? ore.empty : block.typeId,
      states: ore ? undefined : block.permutation.getAllStates(),
      restoreTime: ms.from('min', Math.randomInt(2, 3)),
    })
    this.scheduledToPlaceBlocks.push(Vec.string(schedule.l))

    return true
  }

  get displayName() {
    return i18n.nocolor`§7Шахта`
  }

  customFormButtons(form: ActionForm, player: Player): void {
    form.button(noI18n`Убрать все руды и сохранить структуру`, () => {
      player.info('Start')
      this.removeAllOresAndResaveStructure()
        .then(e => player.info(i18n`End ${e}`))
        .catch((e: unknown) => player.fail(i18n.error`${e}`))
    })
  }
}

registerSaveableRegion('mine', MineshaftRegion)
registerRegionType(noI18n`Шахты`, MineshaftRegion)
