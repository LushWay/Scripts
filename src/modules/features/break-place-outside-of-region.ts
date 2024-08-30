import { Player } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Cooldown, ms, Vector } from 'lib'
import { actionGuard, ActionGuardOrder, BLOCK_CONTAINERS, DOORS, SWITCHES, TRAPDOORS } from 'lib/region/index'
import { BaseRegion } from 'modules/places/base/region'
import { isScheduledToPlace, scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

const INTERACTABLE = DOORS.concat(SWITCHES, TRAPDOORS, BLOCK_CONTAINERS)
const INTERACTABLEITEMS = Object.values(MinecraftItemTypes)
  .filter(e => e.includes('axe'))
  .concat(MinecraftItemTypes.FlintAndSteel) as (undefined | string)[]

const youCannot = (player: Player) => {
  if (textCooldown.isExpired(player))
    player.fail(`Вы не можете ломать непоставленные блоки вне баз, шахт или других зон добычи`)
  return false
}
const textCooldown = new Cooldown(ms.from('sec', 2), false)

actionGuard((player, region, ctx) => {
  if (ctx.type === 'place') {
    if (region instanceof BaseRegion) return youCannot(player)
    else if (region) return

    scheduleBlockPlace({
      dimension: ctx.event.block.dimension.type,
      restoreTime: ms.from('sec', 10),
      typeId: MinecraftBlockTypes.Air,
      states: void 0,
      location: Vector.floor(Vector.add(ctx.event.block.location, ctx.event.faceLocation)),
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

    const scheduled = !!isScheduledToPlace(ctx.event.block, ctx.event.block.dimension.type)
    return scheduled || !interactable
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (!region && ctx.type === 'interactWithEntity') {
    return true
  }
}, ActionGuardOrder.Permission)
