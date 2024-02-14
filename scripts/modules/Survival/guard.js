import { Vector } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { INTERACTABLE_ENTITIES, loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/isBuilding'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { Airdrop, EventSignal, PlaceAction } from 'smapi.js'

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

  if (ctx.type === 'interactWithEntity') {
    if (INTERACTABLE_ENTITIES.includes(ctx.event.target.typeId) && !region?.permissions.pvp) return true

    if (ctx.event.target.typeId === MinecraftEntityTypes.ChestMinecart) {
      const airdrop = Airdrop.instances.find(e => e.chestMinecart?.id === ctx.event.target.id)
      // Check if airdrop is for specific user
      if (airdrop?.for) {
        if (player.id !== airdrop.for) return false
        return true
      }
    }
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
    }

    Spawn.regionCallback(player, currentRegion)
  },
})

Join.config.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§aShp1nat§6Mine§r§f',
  },
}
Join.config.subtitle = 'Добро пожаловать!'
