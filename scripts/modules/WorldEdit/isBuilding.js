import { Player } from '@minecraft/server'
import { PersistentSet } from 'lib/Database/PersistentObjects.js'
import { getRole } from 'lib/roles.js'

export const CURRENT_BUILDERS = new PersistentSet('onlineBuilderList')

/**
 * @param {Player} player
 */
export function isBuilding(player, uptodate = false) {
  if (uptodate) return player.isGamemode('creative') && getRole(player) !== 'member'
  return CURRENT_BUILDERS.has(player.id)
}

/**
 * @param {Player} player
 */
export function isNotPlaying(player) {
  return isBuilding(player, true) || player.isGamemode('spectator')
}
