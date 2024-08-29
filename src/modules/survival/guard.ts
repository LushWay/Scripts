import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { PlayerEvents } from 'lib/assets/player-properties'
import { Core } from 'lib/extensions/core'
import { isBuilding } from 'lib/game-utils'
import { Join } from 'lib/player-join'
import { INTERACTABLE_ENTITIES, actionGuard, loadRegionsWithGuards } from 'lib/region/index'
import { Spawn } from 'modules/places/spawn'

console.log('§7Mode is survival')
export const ALLOW_SPAWN_PROP = 'allowSpawn'

actionGuard((player, region) => {
  // Allow any action to player in creative
  if (isBuilding(player)) return true

  // Allow any action to region member
  if (region?.getMemberRole(player.id)) return true
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

actionGuard((player, region, ctx) => {
  if (ctx.type === 'interactWithEntity' || ctx.type === 'interactWithBlock') {
    const { typeId } = player.mainhand()

    if (typeId === MinecraftItemTypes.Bow || typeId === MinecraftItemTypes.Crossbow) {
      if (
        region?.permissions.allowedEntities === 'all' ||
        region?.permissions.allowedEntities.includes(MinecraftItemTypes.Arrow) ||
        region?.permissions.allowedEntities.includes(MinecraftItemTypes.FireworkRocket)
      ) {
        // Allow
      } else {
        return false
      }
    }
  }
})

loadRegionsWithGuards({
  spawnAllowed(region, event) {
    if (event.entity.getDynamicProperty(ALLOW_SPAWN_PROP)) return true
    return (
      !region ||
      region.permissions.allowedEntities === 'all' ||
      region.permissions.allowedEntities.includes(event.entity.typeId)
    )
  },

  regionCallback(player, currentRegion) {
    if (currentRegion) {
      if (!currentRegion.permissions.pvp && !isBuilding(player)) {
        player.triggerEvent(
          player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
        )
      }
    }

    Spawn.regionCallback(player, currentRegion)
  },
})

Join.config.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: `${Core.name}§r§f`,
  },
}
Join.config.subtitle = 'Добро пожаловать!'
