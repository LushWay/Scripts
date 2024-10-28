import { Player, world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import './player'

describe('player database', () => {
  it('should return player name', () => {
    // @ts-expect-error
    const player = new Player() as Player

    expect(Player.name(player.id)).toBe(player.name)
  })

  it('should return undefined for empty id', () => {
    expect(Player.name('')).toBeUndefined()
  })

  it('should skip respawns', () => {
    // @ts-expect-error
    const player = new Player() as Player

    // @ts-expect-error
    EventSignal.emit(world.afterEvents.playerSpawn, { player, initialRespawn: false })
  })
})
