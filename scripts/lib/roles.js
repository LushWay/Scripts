import { Player, system, world } from '@minecraft/server'
import { EventSignal } from 'lib.js'
import { util } from 'lib/util.js'
import { PLAYER_DB } from './Database/Player.js'

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
  grandBuilder: '§bГл. Строитель',
  builder: '§3Строитель',
  member: '§fУчастник',
  spectator: '§9Наблюдатель',
  tester: '§9Тестер',
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

  grandBuilder: ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin', 'grandBuilder'],
  builder: ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin', 'builder', 'grandBuilder'],
  member: Object.keys(ROLES).filter(e => e !== 'spectator'),
  spectator: [], // Any
  tester: Object.keys(ROLES).filter(e => e !== 'spectator' && e !== 'member'),
}

/** @type {Role[]} */
export const WHO_CAN_CHANGE = ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin', 'grandBuilder']

/**
 * Checks if player has permissions for performing role actions. (e.g. if player role is above or equal)
 * @param {string} playerID ID of the player to get role from
 * @param {Role} role Role to check
 * @example is(player.id, 'admin') // Player is admin, grandAdmin or any role above
 * @example is(player.id, 'grandBuilder') // Player is grandBuilder, chefAdmin, techAdmin or any role above
 */
export function is(playerID, role) {
  if (!PERMISSIONS[role].length) return true
  return PERMISSIONS[role].includes(getRole(playerID))
}

/**
 * Gets the role of this player
 * @param  {Player | string} playerID Player or his id to get role from
 * @returns {Role} Player role
 * @example getRole(player.id)
 */
export function getRole(playerID) {
  if (playerID instanceof Player) playerID = playerID.id

  const role = PLAYER_DB[playerID]?.role

  if (!Object.keys(ROLES).includes(role)) return 'member'
  return role
}

/**
 * Gets displayable the role of this player
 * @param  {Player | string} playerID - Player or his id to get role from
 * @param {object} [o] - Options
 * @param {boolean} [o.role=true] - Whenther to include role or not
 * @param {boolean} [o.name=true] - Whenether to include player name or not
 * @param {string} [o.noName='Unknown'] - Name to display if no name was found
 * @param {string} [o.nameColor='§r§f'] - String used between role and name
 * @param {boolean} [o.clearColorAfter] - Whenether to add §r at the end of the string or not
 * @param {boolean} [o.nameSpacing] - Add spacing after role. Defaults to !!name
 * @example getDisplayRole(player.id, { name: true }) // §aРуководство XilLeR228
 */
export function getRoleAndName(
  playerID,
  {
    role: useRole = true,
    name = true,
    nameSpacing = !!name,
    noName = 'Unknown',
    nameColor = '§r§f',
    clearColorAfter = true,
  } = {}
) {
  let display = ''

  if (useRole) {
    const role = getRole(playerID)
    if (role !== 'member') {
      display += ROLES[role]
      if (nameSpacing) display += ' '
    }
  }

  if (name) {
    display += nameColor
    if (playerID instanceof Player) {
      display += playerID.name
    } else {
      const name = Player.name(playerID)
      display += name ? name : noName
    }
  }

  if (clearColorAfter) display += '§r'

  return display
}

/**
 * Sets the role of this player
 * @example setRole(player.id, "admin")
 * @param {Player | string} player
 * @param {Role} role
 * @returns {void}
 */
export function setRole(player, role) {
  const id = player instanceof Player ? player.id : player
  const DB = PLAYER_DB[id]
  if (DB) {
    EventSignal.emit(Core.beforeEvents.roleChange, {
      id,
      player: player instanceof Player ? player : undefined,
      newRole: role,
      oldRole: DB.role,
    })

    // @ts-expect-error Settings role in the setRole function is allowed
    // it is marked readonly so no other functions will change that
    DB.role = role
  }
}

Core.beforeEvents.roleChange.subscribe(({ newRole, oldRole, player }) => {
  if (!player) return
  if (newRole === 'spectator') {
    player.runCommand('gamemode spectator')
  } else if (oldRole !== 'spectator') {
    player.runCommand('gamemode s')
  }
})

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) {
    if (player.database.role === 'spectator') {
      player.runCommand('gamemode spectator')
    }
  }
})

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
    const player = Player.byName(event.message)
    if (!player) return console.warn(`(SCRIPTEVENT::${event.id}) PLAYER NOT FOUND`)

    setRole(player, role)
    console.warn(`(SCRIPTEVENT::${event.id}) ROLE HAS BEEN SET`)
  }
})
