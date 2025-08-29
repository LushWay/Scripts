import { Player, system } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Cooldown, ms } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { actionGuard, ActionGuardOrder, BLOCK_CONTAINERS, DOORS, GATES, SWITCHES, TRAPDOORS } from 'lib/region/index'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { BaseRegion } from 'modules/places/base/region'

const INTERACTABLE = DOORS.concat(SWITCHES, TRAPDOORS, BLOCK_CONTAINERS, GATES)
const INTERACTABLEITEMS = Object.values(MinecraftItemTypes)
  .filter(e => e.includes('axe') || e.includes('hoe'))
  .concat(MinecraftItemTypes.FlintAndSteel) as (undefined | string)[]

const textCooldown = new Cooldown(ms.from('sec', 2), false)

function youCannot(player: Player) {
  if (textCooldown.isExpired(player)) {
    system.delay(() =>
      player.onScreenDisplay.setActionBar(
        i18n.error`Вы не можете ломать не поставленные игроками блоки\nвне вашей базы, шахты или зоны добычи`.to(
          player.lang,
        ),
        ActionbarPriority.High,
      ),
    )
  }
  return false
}

actionGuard((player, region, ctx) => {
  const { event, type } = ctx
  switch (type) {
    case 'break':
      if (region) return
      if (!ScheduleBlockPlace.has(event.block, event.block.dimension.type)) return youCannot(player)
      else return true

    case 'place':
      if (region instanceof BaseRegion) return youCannot(player)
      else if (region) return

      ScheduleBlockPlace.setBlock(event.block, ms.from('min', 1))
      return true

    case 'interactWithBlock': {
      const interactableItem = INTERACTABLEITEMS.includes(event.itemStack?.typeId)
      const interactable = INTERACTABLE.includes(event.block.typeId) || interactableItem
      if (interactable && region instanceof BaseRegion) return youCannot(player)

      const scheduled = !!ScheduleBlockPlace.has(event.block, event.block.dimension.type)
      return scheduled || !interactable
    }

    case 'interactWithEntity':
      if (!region) return true
  }
}, ActionGuardOrder.Permission)
