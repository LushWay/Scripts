import { Entity, Player, system } from '@minecraft/server'

/**
 * @type {((player: Player) => string | false)[]}
 */
export const PLAYER_NAME_TAG_MODIFIERS = [player => player.name]

system.runPlayerInterval(player => setNameTag(player, ''), 'player.nameTag modifiers', 40)

/**
 * @param {Player} player
 */
function parsePlayerNameTagModifiers(player) {
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
  if (!entity.isValid()) return
  if (entity instanceof Player) nameTag = parsePlayerNameTagModifiers(entity)
  if (typeof nameTag === 'function') nameTag = nameTag()
  if (entity.nameTag !== nameTag) entity.nameTag = nameTag
}
