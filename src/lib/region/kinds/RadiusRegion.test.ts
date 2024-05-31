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

  it('should detect if vector is in region', () => {
    const region = RadiusRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })

    expect(region.isVectorInRegion({ x: 0, y: 0, z: 0 }, 'overworld')).toBe(true)
    expect(region.isVectorInRegion({ x: 0, y: 0, z: 0 }, 'nether')).toBe(false)
    expect(region.isVectorInRegion({ x: 0, y: 3, z: 0 }, 'overworld')).toBe(false)
  })
})
