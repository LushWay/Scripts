import { Vector } from 'lib/vector'
import { describe, expect, it } from 'vitest'
import { BossArenaRegion } from './BossArenaRegion'

describe('BossArenaRegion', () => {
  it('should create region', () => {
    const region = BossArenaRegion.create({ center: Vector.one, radius: 1, dimensionId: 'overworld' })

    expect(region).toBeInstanceOf(BossArenaRegion)
  })
})
