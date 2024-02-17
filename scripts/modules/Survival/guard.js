import { INTERACTABLE_ENTITIES, actionGuard, loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/isBuilding'
import { Spawn } from 'modules/Places/Spawn.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'

console.log('§7Mode is survival')

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
}, -100)

loadRegionsWithGuards({
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
