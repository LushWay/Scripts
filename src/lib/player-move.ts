import { Player, ShortcutDimensions, system, world } from '@minecraft/server'
import type { Region } from 'lib/region'
import { Vec } from 'lib/vector'
import { EventSignal } from './event-signal'
import { VectorInDimension } from './utils/point'
import { WeakPlayerMap } from './weak-player-storage'

interface PlayerPosition extends VectorInDimension {
  player: Player
}

/** Event that triggers when player location or dimension changes */
export const onPlayerMove = new EventSignal<PlayerPosition>()

/** Cache used by {@link onPlayerMove}. Updates every job run */
export const playerPositionCache = new WeakPlayerMap<PlayerPosition>()

export function anyPlayerNear(location: Vector3, dimensionType: ShortcutDimensions, radius: number) {
  for (const player of playerPositionCache.values()) {
    if (dimensionType !== player.dimensionType) continue
    if (Vec.distance(player.location, location) < radius) return true
  }

  return false
}

export function anyPlayerNearRegion(region: Region, radius: number) {
  for (const player of playerPositionCache.values()) {
    if (region.area.isNear(player, radius)) return true
  }
  return false
}

// Do it sync on first run because some of the funcs above use it sync. It will start interval too
for (const _ of jobPlayerPosition()) void 0

function jobInterval() {
  system.delay(() => system.runJob(jobPlayerPosition()))
}

function* jobPlayerPosition() {
  try {
    for (const player of world.getAllPlayers()) {
      if (!player.isValid) continue

      const { location: location, dimension } = player
      const { type: dimensionType } = dimension

      const cache = playerPositionCache.get(player)

      if (
        cache &&
        cache.dimensionType === dimensionType &&
        cache.location.x === location.x &&
        cache.location.y === location.y &&
        cache.location.x === location.x
      )
        return

      const position: PlayerPosition = { location, dimensionType, player }
      playerPositionCache.set(player, position)
      EventSignal.emit(onPlayerMove, position)
      yield
    }
  } catch (e) {
    console.error('onPlayerMove:', e)
  } finally {
    jobInterval()
  }
}
