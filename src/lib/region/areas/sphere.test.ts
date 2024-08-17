import { describe, expect, it } from 'vitest'
import { SphereArea } from './sphere'

describe('shpere', () => {
  it('should detect if vector is in region', () => {
    const sphere = new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 })

    expect(sphere.isVectorIn({ x: 0, y: 0, z: 0 }, 'overworld')).toBe(true)
    expect(sphere.isVectorIn({ x: 0, y: 0, z: 0 }, 'nether')).toBe(false)
    expect(sphere.isVectorIn({ x: 0, y: 3, z: 0 }, 'overworld')).toBe(false)

    expect(sphere.edges).toEqual([
      { x: 1, y: 1, z: 1 },
      { x: -1, y: -1, z: -1 },
    ])

    sphere.radius = 10
    sphere.center = { x: 10, y: 10, z: 10 }
    expect(sphere.center).toEqual({ x: 10, y: 10, z: 10 })
  })
})
