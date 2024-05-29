import 'lib/load/enviroment'

import 'lib/database/player'

import { GameMode, Player } from '@minecraft/server'
import { describe, expect, it } from 'vitest'
import { getRole, setRole } from './roles'

describe('roles auto switch gamemode', () => {
  it('should switch gamemode', () => {
    // @ts-expect-error
    const player = new Player() as Player

    expect(player.getGameMode()).toBe(GameMode.spectator)

    expect(getRole(player)).toBe('spectator')
    expect(getRole(player.id)).toBe(getRole(player))

    setRole(player, 'admin')
    expect(player.getGameMode()).toBe(GameMode.survival)

    setRole(player, 'spectator')
    expect(player.getGameMode()).toBe(GameMode.spectator)
  })
})
