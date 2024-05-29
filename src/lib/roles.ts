import { GameMode, Player, ScriptEventSource, system, world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { util } from 'lib/util'

declare global {
  /** Any known role */
  type Role = keyof typeof ROLES
}

/** The roles that are in this server */
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

/** List of role permissions */
const PERMISSIONS: Record<Role, Role[]> = {
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

/**
 * List of roles who can change role that goes after their position
 *
 * Also known as role hierarchy
 */
export const WHO_CAN_CHANGE: Role[] = ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin', 'grandBuilder']

/**
 * Checks if player has permissions for performing role actions. (e.g. if player role is above or equal)
 *
 * @example
 *   is(player.id, 'admin') // Player is admin, grandAdmin or any role above
 *
 * @example
 *   is(player.id, 'grandBuilder') // Player is grandBuilder, chefAdmin, techAdmin or any role above
 *
 * @param playerID ID of the player to get role from
 * @param role Role to check
 */
export function is(playerID: string, role: Role) {
  if (!PERMISSIONS[role].length) return true

  return PERMISSIONS[role].includes(getRole(playerID))
}

/**
 * Gets the role of this player
 *
 * @example
 *   getRole(player.id)
 *
 * @example
 *   getRole(player)
 *
 * @param playerID Player or his id to get role from
 * @returns Player role
 */
export function getRole(playerID: Player | string): Role {
  if (playerID instanceof Player) playerID = playerID.id

  const role = Player.database[playerID]?.role

  if (!Object.keys(ROLES).includes(role)) return 'member'
  return role
}

/**
 * Gets displayable the role of this player
 *
 * @example
 *   getDisplayRole(player.id) === '§aРуководство §r§fXilLeR228§r'
 *
 * @example
 *   getDisplayRole(player.id, { name: false }) === '§aРуководство§r'
 *
 * @param playerID - Player or his id to get role from
 * @param o - Options
 * @param o.role - Whenther to include role or not. Default is `true`
 * @param o.name - Whenether to include player name or not. Default is `true`
 * @param o.noName - Name to display if no name was found. Default is `'Unknown'`
 * @param o.nameColor - String used between role and name. Default is `'§r§f'`
 * @param o.clearColorAfter - Whenether to add §r at the end of the string or not
 * @param o.nameSpacing - Add spacing after role. Defaults to !!name
 */
export function getRoleAndName(
  playerID: Player | string,
  {
    role: useRole = true,
    name = true,
    nameSpacing = !!name,
    noName = 'Unknown',
    nameColor = '§r§f',
    clearColorAfter = true,
  }: {
    role?: boolean
    name?: boolean
    noName?: string
    nameColor?: string
    clearColorAfter?: boolean
    nameSpacing?: boolean
  } = {},
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
 *
 * @example
 *   setRole(player.id, 'admin')
 *
 * @example
 *   setRole(player, 'member')
 *
 * @param player - Player to set role one
 * @param role - Role to set
 */
export function setRole(player: Player | string, role: Role): void {
  const id = player instanceof Player ? player.id : player
  const database = Player.database[id]
  if (database) {
    EventSignal.emit(Core.beforeEvents.roleChange, {
      id,
      player: player instanceof Player ? player : Player.getById(player),
      newRole: role,
      oldRole: database.role,
    })

    // @ts-expect-error settings role in setRole function is allowed
    // role property is marked readonly so no other functions will change that
    database.role = role
  }
}

// Set spectator gamemode to the spectator role
Core.beforeEvents.roleChange.subscribe(({ newRole, oldRole, player }) => {
  if (!player) return
  if (newRole === 'spectator') {
    player.setGameMode(GameMode.spectator)
  } else if (oldRole === 'spectator') {
    player.setGameMode(GameMode.survival)
  }
})

// Set spectator gamemode on join with spectator role
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (player.isSimulated()) return
  if (initialSpawn) {
    if (player.database.role === 'spectator') {
      player.setGameMode(GameMode.spectator)
    }
  }
})

if (!__VITEST__) {
  // Allow recieving roles from scriptevent function run by console
  system.afterEvents.scriptEventReceive.subscribe(event => {
    if (event.id.toLowerCase().startsWith('role:')) {
      if (event.sourceType === ScriptEventSource.Server) {
        // Allow
      } else {
        if (Object.values(Player.database).find(e => WHO_CAN_CHANGE.includes(e.role))) {
          return console.error(`(SCRIPTEVENT::${event.id}) Admin already set.`)
        }
      }

      const role = event.id.toLowerCase().replace('role:', '')
      if (!util.isKeyof(role, ROLES)) {
        return console.error(
          `(SCRIPTEVENT::${event.id}) Unkown role: ${role}, allowed roles:\n${Object.entries(ROLES)
            .map(e => e[0] + ': ' + e[1])
            .join('\n')}`,
        )
      }

      const player = Player.getByName(event.message)
      if (!player) return console.error(`(SCRIPTEVENT::${event.id}) PLAYER NOT FOUND`)

      setRole(player, role)
      console.warn(`(SCRIPTEVENT::${event.id}) ROLE HAS BEEN SET`)
    }
  })
}
