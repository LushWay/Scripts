import { Player, world } from '@minecraft/server'

/**
 * @type {Pick<Map<string, unknown>, 'has' | 'delete'>[]}
 */
const removePlayerFromMapsOnLeave = []

/**
 * @template T
 * @extends {Map<string, T>}
 */
export class WeakPlayerMap extends Map {
  /**
   * Creates new WeakPlayerMap
   * @param {object} options - Options
   * @param {boolean} options.removeOnLeave - Whenether to remove player from map when it leavs
   */
  constructor(options) {
    super()
    this.options = options
    if (options.removeOnLeave) removePlayerFromMapsOnLeave.push(this)
  }

  /**
   * @private
   * @param {Player | string} player
   */
  key(player) {
    return player instanceof Player ? player.id : player
  }

  /**
   * @param {Player | string} player
   */
  get(player) {
    return super.get(this.key(player))
  }

  /**
   * @param {Player | string} player
   * @param {T} value
   */
  set(player, value) {
    super.set(this.key(player), value)
    return this
  }

  /**
   * @param {Player | string} player
   */
  has(player) {
    return super.has(this.key(player))
  }

  /**
   * @param {Player | string} player
   */
  delete(player) {
    return super.delete(this.key(player))
  }
}

/**
 * The main difference between WeakPlayerMap and WeakOnlinePlayer map is that
 * WeakOnlinePlayerMap uses Player as key, so you can iterate throught them.
 * The downtake for this is that map will always remove references when player
 * leaves from world.
 * @template T
 * @extends {Map<Player, T>}
 */
export class WeakOnlinePlayerMap extends Map {
  constructor() {
    super()
    removePlayerFromMapsOnLeave.push(this)
  }

  /**
   * @private
   * @param {Player | string} player
   */
  key(player) {
    if (player instanceof Player) return player
    for (const key of this.keys()) if (key.id === player) return key
    return false
  }

  /**
   * @param {Player | string} player
   */
  has(player) {
    const key = this.key(player)
    if (!key) return false
    return super.has(key)
  }

  /**
   * @param {Player | string} player
   */
  delete(player) {
    const key = this.key(player)
    if (!key) return false
    return super.delete(key)
  }
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of removePlayerFromMapsOnLeave) {
    if (map.has(playerId)) map.delete(playerId)
  }
})
