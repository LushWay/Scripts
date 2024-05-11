import { Player } from '@minecraft/server'
import { PersistentSet } from 'lib/database/persistent-objects'
import { getRole } from 'lib/roles'

export const CURRENT_BUILDERS = new PersistentSet('onlineBuilderList')

export function isBuilding(player: Player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative') && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

export function isNotPlaying(player: Player) {
  return isBuilding(player, true) || player.isGamemode('spectator')
}
