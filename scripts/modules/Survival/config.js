import { loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/list.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Spawn } from 'modules/Survival/Place/Spawn.js'
import { EventSignal } from 'smapi.js'

console.log('§9Survival setup')

/**
 * @type {EventSignal<Parameters<import('lib/Region/index.js').interactionAllowed>, boolean | undefined, import('lib/Region/index.js').interactionAllowed>}
 */
export const INTERACTION_GUARD = new EventSignal()

INTERACTION_GUARD.subscribe(player => {
  if (isBuilding(player)) return true
}, 100)

INTERACTION_GUARD.subscribe((player, region) => {
  if (region?.regionMember(player.id)) return true
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
      if (player.database.survival.inv === 'spawn' && !isBuilding(player)) {
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
