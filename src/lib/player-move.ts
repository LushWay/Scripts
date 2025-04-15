import { Player, ShortcutDimensions, system, world } from '@minecraft/server'
import type { Region } from 'lib/region'
import { Vector } from 'lib/vector'
import { EventSignal } from './event-signal'
import { WeakPlayerMap } from './weak-player-storage'

interface PlayerPosition {
  player: Player
  vector: Vector3
  dimensionType: DimensionType
}

/** Event that triggers when player location or dimension changes */
export const onPlayerMove = new EventSignal<PlayerPosition>()

/** Cache used by {@link onPlayerMove}. Updates every job run */
export const playerPositionCache = new WeakPlayerMap<PlayerPosition>()

export function anyPlayerNear(location: Vector3, dimensionType: ShortcutDimensions, radius: number) {
  for (const player of playerPositionCache.values()) {
    if (dimensionType !== player.dimensionType) continue
    if (Vector.distance(player.vector, location) < radius) return true
  }

  return false
}

export function anyPlayerNearRegion(region: Region, radius: number) {
  for (const player of playerPositionCache.values()) {
    if (region.area.isNear(player, radius)) return true
  }
  return false
}

jobInterval()

function jobInterval() {
  system.delay(() => system.runJob(jobPlayerPosition()))
}

function* jobPlayerPosition() {
  try {
    for (const player of world.getAllPlayers()) {
      if (!player.isValid) continue

      const { location: vector, dimension } = player
      const { type: dimensionType } = dimension

      const cache = playerPositionCache.get(player)

      if (
        cache &&
        cache.dimensionType === dimensionType &&
        cache.vector.x === vector.x &&
        cache.vector.y === vector.y &&
        cache.vector.x === vector.x
      )
        return

      const position: PlayerPosition = { vector, dimensionType, player }
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
