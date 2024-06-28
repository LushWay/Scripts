import { Vector } from 'lib/vector'
import { describe, expect, it } from 'vitest'
import { BossArenaRegion } from './boss-arena'

describe('BossArenaRegion', () => {
  it('should create region', () => {
    const region = BossArenaRegion.create({ center: Vector.one, radius: 1, dimensionId: 'overworld' })

    expect(region).toBeInstanceOf(BossArenaRegion)
  })
})
