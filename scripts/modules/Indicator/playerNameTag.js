import { Entity, Player, system } from '@minecraft/server'
import { GAME_UTILS } from 'lib/GameUtils.js'

/**
 * @type {((player: Player) => string | false)[]}
 */
export const PLAYER_NAME_TAG_MODIFIERS = [
  player => {
    const name = GAME_UTILS.safeGet(player, 'name')
    if (name) return name
    return false
  },
]

system.runPlayerInterval(player => setNameTag(player, ''), 'player.nameTag modifiers', 40)

/**
 * @param {Player} player
 */
export function parsePlayerNameTagModifiers(player) {
  return PLAYER_NAME_TAG_MODIFIERS.map(modifier => modifier(player))
    .filter(result => result !== false)
    .join('')
}

/**
 *
 * @param {Entity} entity
 * @param {string | (() => string)} nameTag
 */
export function setNameTag(entity, nameTag) {
  if (entity instanceof Player) nameTag = parsePlayerNameTagModifiers(entity)
  if (typeof nameTag === 'function') nameTag = nameTag()
  const entityNameTag = GAME_UTILS.safeGet(entity, 'nameTag')
  if (entityNameTag !== nameTag) entity.nameTag = nameTag
}
