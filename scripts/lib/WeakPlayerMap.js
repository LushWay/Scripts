import { Player, world } from '@minecraft/server'

/** @param {Player | string} player */
const id = player => (player instanceof Player ? player.id : player)

/** @type {Pick<Map<string, unknown>, 'has' | 'delete'>[]} */
const removePlayerFromMapsOnLeave = []

/**
 * @template T
 * @extends {Map<string, T>}
 */
export class WeakPlayerMap extends Map {
  /**
   * Creates new WeakPlayerMap
   *
   * @param {object} options - Options
   * @param {boolean} options.removeOnLeave - Whenether to remove player from map when it leavs
   */
  constructor(options) {
    super()
    this.options = options
    if (options.removeOnLeave) removePlayerFromMapsOnLeave.push(this)
  }

  /** @param {Player | string} player */
  get(player) {
    return super.get(id(player))
  }

  /**
   * @param {Player | string} player
   * @param {T} value
   */
  set(player, value) {
    super.set(id(player), value)
    return this
  }

  /** @param {Player | string} player */
  has(player) {
    return super.has(id(player))
  }

  /** @param {Player | string} player */
  delete(player) {
    return super.delete(id(player))
  }
}

/**
 * The main difference between WeakPlayerMap and WeakOnlinePlayer map is that WeakOnlinePlayerMap uses Player as key, so
 * you can iterate throught them. The downtake for this is that map will always remove references when player leaves
 * from world.
 *
 * @template T
 * @extends {Map<string, { value: T; player: Player }>}
 */
export class WeakOnlinePlayerMap extends Map {
  constructor() {
    super()
    removePlayerFromMapsOnLeave.push(this)
  }

  /** @param {Player | string} player */
  get(player) {
    return super.get(id(player))
  }

  /**
   * @param {Player | string} key
   * @param {T | { value: T; player: Player }} value
   */
  set(key, value) {
    if (!(typeof value === 'object' && value && 'value' in value)) {
      // Converting T to { value: T, player: Player }
      // Convert `id | Player` to Player
      const player = typeof key === 'string' ? Player.getById(key) : key

      if (!player) return this // No player found, do nothing because its online only map

      value = { player, value }
    }

    return super.set(id(key), value)
  }

  /** @param {Player | string} player */
  has(player) {
    return super.has(id(player))
  }

  /** @param {Player | string} player */
  delete(player) {
    return super.delete(id(player))
  }
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of removePlayerFromMapsOnLeave) {
    if (map.has(playerId)) map.delete(playerId)
  }
})
