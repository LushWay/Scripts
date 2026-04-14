import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { Items } from 'lib/assets/custom-items'
import { PlayerEvents, PlayerProperties } from 'lib/assets/player-json'
import {
  actionGuard,
  ActionGuardOrder,
  NOT_MOB_ENTITIES,
  PVP_ENTITIES,
  regionPermissions,
  SafeAreaRegion,
} from 'lib/region'
import { RegionEvents } from 'lib/region/events'
import { isNotPlaying } from 'lib/utils/game'

SafeAreaRegion.enableGamemodeChange()

NOT_MOB_ENTITIES.push(CustomEntityTypes.Grave, CustomEntityTypes.Loot)

PVP_ENTITIES.push(CustomEntityTypes.Fireball, CustomEntityTypes.Cannon)

RegionEvents.onInterval.subscribe(({ player, currentRegion }) => {
  const isPlaying = !isNotPlaying(player)

  const resetNewbie = () => player.setProperty(PlayerProperties['lw:newbie'], !!player.database.survival.newbie)

  if (typeof currentRegion !== 'undefined' && isPlaying) {
    if (currentRegion.permissions.pvp === false) {
      player.triggerEvent(
        player.database.inv === 'spawn' ? PlayerEvents['player:spawn'] : PlayerEvents['player:safezone'],
      )
      player.setProperty(PlayerProperties['lw:newbie'], true)
    } else if (currentRegion.permissions.pvp === 'pve') {
      player.setProperty(PlayerProperties['lw:newbie'], true)
    } else resetNewbie()
  } else resetNewbie()
})

regionPermissions.itemToProjectile.set(Items.Fireball, CustomEntityTypes.Fireball)

// Allow by default
actionGuard(ctx => {
  return true
}, ActionGuardOrder.Lowest)
