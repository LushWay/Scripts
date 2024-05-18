import { Player, world } from '@minecraft/server'

const id = (player: Player | string) => (player instanceof Player ? player.id : player)
const onlineWeakMaps: (Pick<Map<string, unknown>, 'has' | 'delete'> & { onLeave?: OnLeaveCallback })[] = []

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const map of onlineWeakMaps) {
    if (map.has(playerId)) {
      map.onLeave?.(playerId)
      map.delete(playerId)
    }
  }
})

type OnLeaveCallback = (playerId: string) => void

export class WeakPlayerMap<T> extends Map<string, T> {
  onLeave?: OnLeaveCallback

  /**
   * Creates new WeakPlayerMap
   *
   * @param options - Options
   * @param options.removeOnLeave - Whenether to remove player from map when it leavs
   */
  constructor(options: { removeOnLeave: boolean; onLeave?: OnLeaveCallback }) {
    super()
    if (options.removeOnLeave) onlineWeakMaps.push(this)
    if (options.onLeave) this.onLeave
  }

  get(player: Player | string) {
    return super.get(id(player))
  }

  set(player: Player | string, value: T) {
    super.set(id(player), value)
    return this
  }

  has(player: Player | string) {
    return super.has(id(player))
  }

  delete(player: Player | string) {
    return super.delete(id(player))
  }
}

/**
 * The main difference between WeakPlayerMap and WeakOnlinePlayer map is that WeakOnlinePlayerMap uses Player as key, so
 * you can iterate throught them. The downtake for this is that map will always remove references when player leaves
 * from world.
 */
export class WeakOnlinePlayerMap<T> extends Map<string, { value: T; player: Player }> {
  constructor() {
    super()
    onlineWeakMaps.push(this)
  }

  get(player: Player | string) {
    return super.get(id(player))
  }

  set(key: Player | string, value: T | { value: T; player: Player }) {
    if (!(typeof value === 'object' && value && 'value' in value)) {
      // Converting T to { value: T, player: Player }
      // Convert `id | Player` to Player
      const player = typeof key === 'string' ? Player.getById(key) : key

      if (!player) return this // No player found, do nothing because its online only map

      value = { player, value }
    }

    return super.set(id(key), value)
  }

  has(player: Player | string) {
    return super.has(id(player))
  }

  delete(player: Player | string) {
    return super.delete(id(player))
  }
}
