import { Vector } from '@minecraft/server'
import { INTERACTABLE_ENTITIES, loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/list.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { EventSignal, PlaceAction } from 'smapi.js'

console.log('§9Survival setup')

/**
 * @type {EventSignal<Parameters<import('lib/Region/index.js').interactionAllowed>, boolean | undefined, import('lib/Region/index.js').interactionAllowed>}
 */
export const ACTION_GUARD = new EventSignal()

/**
 *
 * @param {Parameters<typeof ACTION_GUARD['subscribe']>[0]} fn
 * @param {number} [position]
 */
export function actionGuard(fn, position) {
  ACTION_GUARD.subscribe(fn, position)
}

actionGuard((player, region) => {
  // Allow any action to player in creative
  if (isBuilding(player)) return true

  // Allow any action to region member
  if (region?.regionMember(player.id)) return true
}, 100)

actionGuard((player, region, ctx) => {
  // Allow interacting with any interactable entity by default
  if (
    ctx.type === 'interactWithEntity' &&
    INTERACTABLE_ENTITIES.includes(ctx.event.target.typeId) &&
    !region?.permissions.pvp
  ) {
    return true
  }

  // Allow using any block specified by PlaceAction.interaction
  if (ctx.type === 'interactWithBlock' && Vector.string(ctx.event.block) in PlaceAction.interactions) return true
}, -100)

loadRegionsWithGuards({
  allowed(player, region, context) {
    for (const [fn] of EventSignal.sortSubscribers(ACTION_GUARD)) {
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
