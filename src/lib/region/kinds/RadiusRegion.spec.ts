import { describe, expect, it } from 'vitest'
import { MineshaftRegion } from './MineshaftRegion'

describe('RadiusRegion', () => {
  it('should create region with right kind type', () => {
    const region = MineshaftRegion.create(
      { center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 },
      'mineshaft',
    )

    // @ts-expect-error Because is a test
    const kind = region.kind
    expect(kind).toBe(MineshaftRegion.kind)
  })
})
