import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ms, Vector } from 'lib'
import { actionGuard, DOORS, SWITCHES, TRAPDOORS } from 'lib/region/index'
import { BaseRegion } from 'modules/places/base/region'
import { isScheduledToPlace, scheduleBlockPlace } from 'modules/survival/scheduled-block-place'

const INTERACTABLE = DOORS.concat(SWITCHES, TRAPDOORS)
const youCannot = `Вы не можете ломать непоставленные блоки вне баз, шахт или других зон добычи`

actionGuard((_, region, ctx) => {
  if (region instanceof BaseRegion) {
    ctx.event.player.fail(youCannot)
    return false
  }
  if (region) return
  if (ctx.type === 'place') {
    scheduleBlockPlace({
      dimension: ctx.event.block.dimension.type,
      restoreTime: ms.from('sec', 10),
      typeId: MinecraftBlockTypes.Air,
      states: void 0,
      location: Vector.floor(Vector.add(ctx.event.block.location, ctx.event.faceLocation)),
    })
    return true
  } else if (ctx.type === 'break') {
    const can = !!isScheduledToPlace(ctx.event.block, ctx.event.block.dimension.type)
    if (!can) ctx.event.player.fail(youCannot)
    return can
  } else if (ctx.type === 'interactWithBlock') {
    const scheduled = !!isScheduledToPlace(ctx.event.block, ctx.event.block.dimension.type)
    const interactable = INTERACTABLE.includes(ctx.event.block.typeId)

    return scheduled || !interactable
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (ctx.type === 'interactWithEntity') {
    return true
  }
}, -11)
