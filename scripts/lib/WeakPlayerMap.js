import { Player, world } from '@minecraft/server'

/**
 * @template T
 * @extends {Map<string, T>}
 */
export class WeakPlayerMap extends Map {
  /**
   * @type {WeakPlayerMap<unknown>[]}
   */
  static instances = []
  /**
   * Creates new WeakPlayerMap
   * @param {object} options - Options
   * @param {boolean} options.removeOnLeave - Whenether to remove player from map when it leavs
   */
  constructor(options) {
    super()
    this.options = options
    WeakPlayerMap.instances.push(this)
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
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of WeakPlayerMap.instances) {
    if (map.options.removeOnLeave && map.has(playerId)) map.delete(playerId)
  }
})
