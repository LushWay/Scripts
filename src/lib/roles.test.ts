import { GameMode, Player } from '@minecraft/server'
import { TEST_createPlayer } from 'test/utils'
import { getRole, is, setRole } from './roles'

describe('roles auto switch gamemode', () => {
  it('should switch gamemode', () => {
    const player = TEST_createPlayer()

    expect(player.getGameMode()).toBe(GameMode.Survival)

    expect(getRole(player)).toBe('member')
    expect(getRole(player.id)).toBe(getRole(player))

    setRole(player, 'admin')
    expect(getRole(player.id)).toBe('admin')
    expect(player.getGameMode()).toBe(GameMode.Survival)

    setRole(player, 'spectator')
    expect(player.getGameMode()).toBe(GameMode.Spectator)

    setRole(player, 'member')
    expect(player.getGameMode()).toBe(GameMode.Survival)
  })

  it('should return valid role', () => {
    // @ts-expect-error
    const player = new Player() as Player

    // @ts-expect-error
    player.database.role = 'oldrole'

    expect(getRole(player)).toBe('member')
  })

  it('should not throw for unknown player', () => {
    setRole('unknown', 'tester')
  })
})

describe('roles is', () => {
  it('should test is', () => {
    const player = TEST_createPlayer()

    expect(is(player.id, 'admin')).toBe(false)
    expect(is(player.id, 'member')).toBe(true)
    expect(is(player.id, 'spectator')).toBe(true)

    setRole(player, 'admin')
    expect(is(player.id, 'admin')).toBe(true)
    expect(is(player.id, 'builder')).toBe(true)
    expect(is(player.id, 'chefAdmin')).toBe(false)
  })
})
