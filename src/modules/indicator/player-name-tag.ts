import { Entity, Player, system } from '@minecraft/server'
import { isNotPlaying } from 'lib'
import { getFullname } from 'lib/get-fullname'

export const PlayerNameTagModifiers: ((player: Player) => string | false)[] = [
  player => {
    const role = getFullname(player, { clan: false, role: isNotPlaying(player), name: false })
    const clanAndName = getFullname(player, { role: false, newbie: false, equippment: true })
    return role ? `${clanAndName}\n${role}` : clanAndName
  },
]

system.runPlayerInterval(player => setNameTag(player, ''), 'player.nameTag modifiers', 40)

function parsePlayerNameTagModifiers(player: Player) {
  return PlayerNameTagModifiers.map(modifier => modifier(player))
    .filter(result => result !== false)
    .join('')
}

export function setNameTag(entity: Entity, nameTag: string | (() => string)) {
  if (!entity.isValid) return
  if (entity instanceof Player) nameTag = parsePlayerNameTagModifiers(entity)
  if (typeof nameTag === 'function') nameTag = nameTag()
  if (entity.nameTag !== nameTag) entity.nameTag = nameTag
}
