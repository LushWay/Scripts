import { SphereArea } from './sphere'

describe('sphere', () => {
  it('should detect if vector is in region', () => {
    const sphere = new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 })

    sphere.isNear({ vector: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' }, 0)

    expect(sphere.isIn({ vector: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(sphere.isIn({ vector: { x: 0, y: 0, z: 0 }, dimensionType: 'nether' })).toBe(false)
    expect(sphere.isIn({ vector: { x: 0, y: 3, z: 0 }, dimensionType: 'overworld' })).toBe(false)

    expect(sphere.edges).toEqual([
      { x: 1, y: 1, z: 1 },
      { x: -1, y: -1, z: -1 },
    ])

    sphere.radius = 10
    sphere.center = { x: 10, y: 10, z: 10 }
    expect(sphere.center).toEqual({ x: 10, y: 10, z: 10 })
  })
})
