import { Player, system, world } from '@minecraft/server'
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

jobInterval()

function jobInterval() {
  system.runJob(jobPlayerPosition())
}

function* jobPlayerPosition() {
  try {
    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue

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
