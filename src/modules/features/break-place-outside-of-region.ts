import { Player, system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Cooldown, ms } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { actionGuard, ActionGuardOrder, BLOCK_CONTAINERS, DOORS, GATES, SWITCHES, TRAPDOORS } from 'lib/region/index'
import { isScheduledToPlace, scheduleBlockPlace } from 'lib/scheduled-block-place'
import { BaseRegion } from 'modules/places/base/region'

const INTERACTABLE = DOORS.concat(SWITCHES, TRAPDOORS, BLOCK_CONTAINERS, GATES)
const INTERACTABLEITEMS = Object.values(MinecraftItemTypes)
  .filter(e => e.includes('axe'))
  .concat(MinecraftItemTypes.FlintAndSteel) as (undefined | string)[]

const youCannot = (player: Player) => {
  if (textCooldown.isExpired(player)) {
    system.delay(() =>
      player.onScreenDisplay.setActionBar(
        `§cВы не можете ломать непоставленные блоки\nвне баз, шахт или других зон добычи`,
        ActionbarPriority.Highest,
      ),
    )
  }
  return false
}
const textCooldown = new Cooldown(ms.from('sec', 2), false)

actionGuard((player, region, ctx) => {
  if (ctx.type === 'place') {
    if (region instanceof BaseRegion) return youCannot(player)
    else if (region) return

    scheduleBlockPlace({
      dimension: ctx.event.block.dimension.type,
      location: ctx.event.block.location,
      states: void 0,
      restoreTime: ms.from('min', 1),
      typeId: MinecraftBlockTypes.Air,
    })
    return true
  } else if (ctx.type === 'break') {
    if (region) return
    // Break
    if (!isScheduledToPlace(ctx.event.block, ctx.event.block.dimension.type)) return youCannot(player)
    else return true
  } else if (ctx.type === 'interactWithBlock') {
    // Interact
    const interactableItem = INTERACTABLEITEMS.includes(ctx.event.itemStack?.typeId)
    const interactable = INTERACTABLE.includes(ctx.event.block.typeId) || interactableItem
    if (interactable && region instanceof BaseRegion) return youCannot(player)

    const scheduled = isScheduledToPlace(ctx.event.block, ctx.event.block.dimension.type)
    return scheduled || !interactable
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (!region && ctx.type === 'interactWithEntity') {
    return true
  }
}, ActionGuardOrder.Permission)
