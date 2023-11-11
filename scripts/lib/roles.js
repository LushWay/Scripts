import { Player, system } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
/**
 * @typedef {{role?: keyof typeof ROLES}} DatabaseType
 */

const DB = new DynamicPropertyDB('player', {
  /** @type {Record<string, DatabaseType>} */
  type: {},
  /**
   * @returns {DatabaseType}
   */
  defaultValue() {
    return { role: 'member' }
  },
}).proxy()

system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id === 'ROLE:ADMIN') {
    const player = Player.fetch(event.message)
    if (!player)
      return console.warn('(SCRIPTEVENT::ROLE:ADMIN) PLAYER NOT FOUND')

    setRole(player, 'admin')
    console.warn('(SCRIPTEVENT::ROLE:ADMIN) ROLE HAS BEEN SET')
  }
})

/**
 * The roles that are in this server
 */
export const ROLES = {
  admin: '§cАдмин',
  moderator: '§5Модератор',
  builder: '§3Строитель',
  member: '§fУчастник',
}

/**
 * Gets the role of this player
 * @param  {Player | string} playerID player or his id to get role from
 * @returns {keyof typeof ROLES}
 * @example getRole("23529890")
 */
export function getRole(playerID) {
  if (playerID instanceof Player) playerID = playerID.id

  const role = DB[playerID]?.role

  if (!role || !Object.keys(ROLES).includes(role)) return 'member'
  return role
}

/**
 * Sets the role of this player
 * @example setRole("342423452", "admin")
 * @param {Player | string} player
 * @param {keyof typeof ROLES} role
 * @returns {void}
 */
export function setRole(player, role) {
  if (player instanceof Player) player = player.id
  DB[player] ??= {}
  const obj = DB[player]
  if (obj) obj.role = role
}

/**
 * Checks if player role included in given array
 * @param {string} playerID
 * @param {keyof typeof ROLES} role
 */
export function is(playerID, role) {
  /** @type {(keyof typeof ROLES)[]} */
  let arr = ['moderator', 'admin']

  if (role === 'member') return true
  if (role === 'builder') arr.push('builder')
  if (role === 'admin') arr = ['admin']

  return arr.includes(getRole(playerID))
}
