import { Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { actionGuard } from 'lib/Region/index.js'
import { scheduleBlockPlace } from 'modules/Survival/utils/scheduledBlockPlace.js'
import { util } from 'smapi.js'

actionGuard((player, region, ctx) => {
  if (!region) {
    // TODO allow on enemy base to disable detecting enemy base
    // TODO maybe add limit
    if (ctx.type === 'break' || ctx.type === 'place' || ctx.type === 'interactWithBlock') {
      const dimension = ctx.event.block.dimension
      const base = {
        dimension: dimension.type,
        restoreTime: util.ms.from('sec', 10),
      }
      if (ctx.type === 'place') {
        scheduleBlockPlace({
          ...base,
          typeId: MinecraftBlockTypes.Air,
          states: void 0,
          location: Vector.floor(Vector.add(ctx.event.block.location, ctx.event.faceLocation)),
        })
      } else if (ctx.type === 'break') {
        scheduleBlockPlace({
          ...base,
          typeId: ctx.event.block.typeId,
          states: ctx.event.block.permutation.getAllStates(),
          location: ctx.event.block.location,
        })
      }

      // Interaction goes before place, so allow but not trigger
      if (ctx.type !== 'interactWithBlock') {
        system.delay(() => {
          if (!player.database.survival.bn) {
            player.fail(
              'Любые изменения вне региона базы исчезнут через 2 минуты. Также, любые сломанные блоки не будут выпадать.'
            )
            player.database.survival.bn = 1
          }
          dimension
            .getEntities({
              type: 'minecraft:item',
              location: ctx.event.block.location,
              maxDistance: 2,
            })
            .forEach(e => {
              try {
                e?.remove()
              } catch {}
            })
        })
      }

      return true
    }
  }
}, -10)
