import { Player, system } from '@minecraft/server'
import { util } from 'lib/util.js'
import { PLAYER_DB } from './Database/Player.js'

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id.toLowerCase().startsWith('role:')) {
    const role = event.id.toLowerCase().replace('role:', '')
    if (!util.isKeyof(role, ROLES)) {
      console.error('Unkown role:', role)
      return console.warn(
        `Allowed roles:\n${Object.entries(ROLES)
          .map(e => e[0] + ': ' + e[1])
          .join('\n')}`
      )
    }
    const player = Player.fetch(event.message)
    if (!player) return console.warn(`(SCRIPTEVENT::${event.id}) PLAYER NOT FOUND`)

    setRole(player, role)
    console.warn(`(SCRIPTEVENT::${event.id}) ROLE HAS BEEN SET`)
  }
})

/**
 * The roles that are in this server
 */
export const ROLES = {
  creator: '§aРуководство',
  curator: '§6Куратор',
  techAdmin: '§cТех. Админ',
  chefAdmin: '§dГл. Админ',
  admin: '§5Админ',
  moderator: '§6Модератор',
  helper: '§eПомошник',
  builder: '§3Строитель',
  member: '§fУчастник',
}

/** @type {Record<Role, Role[]>} */
const PERMISSIONS = {
  creator: ['creator'],
  curator: ['creator', 'curator'],
  techAdmin: ['creator', 'curator', 'techAdmin'],

  chefAdmin: ['creator', 'curator', 'chefAdmin'],
  admin: ['creator', 'curator', 'chefAdmin', 'admin'],
  moderator: ['creator', 'curator', 'chefAdmin', 'admin', 'moderator'],
  helper: ['creator', 'curator', 'chefAdmin', 'admin', 'moderator', 'helper'],

  builder: ['creator', 'curator', 'builder', 'chefAdmin', 'techAdmin', 'admin'],
  member: [], // Any
}

/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {Role} role
 */
export function is(playerID, role) {
  if (role === 'member') return true
  return PERMISSIONS[role].includes(getRole(playerID))
}

/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {Role}
 * @example getRole("23529890")
 */
export function getRole(playerID) {
  if (playerID instanceof Player) playerID = playerID.id

  const role = PLAYER_DB[playerID]?.role

  if (!Object.keys(ROLES).includes(role)) return 'member'
  return role
}

/**
 * Sets the role of this player
 * @example setRole("342423452", "admin")
 * @param {Player | string} player
 * @param {Role} role
 * @returns {void}
 */
export function setRole(player, role) {
  if (player instanceof Player) player = player.id
  const obj = PLAYER_DB[player]
  if (obj) obj.role = role
}
