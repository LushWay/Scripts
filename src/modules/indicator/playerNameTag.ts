import { Entity, Player, system } from '@minecraft/server'

export const PLAYER_NAME_TAG_MODIFIERS: ((player: Player) => string | false)[] = [player => player.name]

system.runPlayerInterval(player => setNameTag(player, ''), 'player.nameTag modifiers', 40)

function parsePlayerNameTagModifiers(player: Player) {
  return PLAYER_NAME_TAG_MODIFIERS.map(modifier => modifier(player))
    .filter(result => result !== false)
    .join('')
}

export function setNameTag(entity: Entity, nameTag: string | (() => string)) {
  if (!entity.isValid()) return
  if (entity instanceof Player) nameTag = parsePlayerNameTagModifiers(entity)
  if (typeof nameTag === 'function') nameTag = nameTag()
  if (entity.nameTag !== nameTag) entity.nameTag = nameTag
}
