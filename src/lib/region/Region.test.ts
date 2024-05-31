import { Player } from '@minecraft/server'
import 'lib/database/player'
import { describe, expect, it } from 'vitest'
import { Region } from './Region'

describe('Region', () => {
  it('should create region', () => {
    expect(
      Region.create({
        dimensionId: 'overworld',
      }),
    ).toBeInstanceOf(Region)
  })

  it('should return owner name', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const region = Region.create({ dimensionId: 'overworld', permissions: { owners: [player.id] } })

    expect(region.ownerName).toBe(player.name)
  })
})
