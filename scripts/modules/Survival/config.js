import { Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data.js'
import { SOUNDS } from 'config.js'
import { loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/list.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { scheduleBlockPlace } from 'modules/Survival/utils/scheduledBlockPlace.js'
import { EventSignal, util } from 'smapi.js'

console.log('§9Survival setup')

/**
 * @type {EventSignal<Parameters<import('lib/Region/index.js').interactionAllowed>, boolean | undefined, import('lib/Region/index.js').interactionAllowed>}
 */
export const INTERACTION_GUARD = new EventSignal()

INTERACTION_GUARD.subscribe(player => {
  if (isBuilding(player)) return true
}, 100)

INTERACTION_GUARD.subscribe((player, region, ctx) => {
  // Allow interacting with any npc by default
  if (ctx.type === 'interactWithEntity' && !region?.permissions.pvp) {
    return true
  }
  if (!region) {
    // TODO Maybe move somewhere
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
            player.playSound(SOUNDS.fail)
            player.tell(
              '§4> §cЛюбые изменения вне региона базы исчезнут через 2 минуты. Также, любые сломанные блоки не будут выпадать.'
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
  } else if (region.regionMember(player.id)) return true
}, -100)

loadRegionsWithGuards({
  allowed(player, region, context) {
    for (const [fn] of EventSignal.sortSubscribers(INTERACTION_GUARD)) {
      const result = fn(player, region, context)
      if (typeof result !== 'undefined') return result
    }
  },

  spawnAllowed(region, data) {
    return (
      !region ||
      region.permissions.allowedEntities === 'all' ||
      region.permissions.allowedEntities.includes(data.entity.typeId)
    )
  },

  regionCallback(player, currentRegion) {
    if (currentRegion) {
      if (!currentRegion?.permissions.pvp && !isBuilding(player)) {
        player.triggerEvent('player:spawn')
      }
    } else {
      if (player.database.inv === 'spawn' && !isBuilding(player)) {
        Spawn.portal?.teleport(player)
      }
    }
  },
})

Join.config.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§aShp1nat§6Mine§r§f',
  },
}
Join.config.subtitle = 'Добро пожаловать!'
