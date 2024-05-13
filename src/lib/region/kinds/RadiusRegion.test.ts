import { describe, expect, it } from 'vitest'
import { RadiusRegion } from './RadiusRegion'

class TestRegion extends RadiusRegion {
  static kind = 'test'
}

describe('RadiusRegion', () => {
  it('should create region with right kind type', () => {
    const region = TestRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })

    // @ts-expect-error Because it is a test
    const kind = region.kind
    expect(kind).toBe(TestRegion.kind)
  })
})
