import { FlattenedSphereArea } from './flattened-sphere'

describe('rectangle', () => {
  it('should detect if vector is in region', () => {
    const flts = new FlattenedSphereArea({ center: { x: 0, y: 0, z: 0 }, rx: 10, ry: 2 }, 'overworld')

    expect(flts.isVectorIn({ x: 0, y: 0, z: 0 }, 'overworld')).toBe(true)
    expect(flts.isVectorIn({ x: 0, y: 2, z: 0 }, 'overworld')).toBe(true)
    expect(flts.isVectorIn({ x: 10, y: 1, z: 0 }, 'overworld')).toBe(true)
    expect(flts.isVectorIn({ x: 9, y: 1, z: 1 }, 'overworld')).toBe(true)

    expect(flts.isVectorIn({ x: 10, y: 1, z: 10 }, 'overworld')).toBe(false)
    expect(flts.isVectorIn({ x: 0, y: 0, z: 0 }, 'nether')).toBe(false)
    expect(flts.isVectorIn({ x: 0, y: 3, z: 0 }, 'overworld')).toBe(false)

    expect(flts.center).toEqual({ x: 0, y: 0, z: 0 })
    expect(flts.isNear({ x: 12, y: 0, z: 0 }, 2)).toBe(true)
    expect(flts.isNear({ x: 12, y: 0, z: 0 }, 1)).toBe(false)

    expect(flts.edges).toEqual([
      { x: 10, y: 2, z: 10 },
      { x: -10, y: -2, z: -10 },
    ])

    expect(flts.radius).toBe(10)

    flts.rx = 12
    flts.ry = 20

    expect(flts.radius).toBe(20)

    flts.center = { x: 10, y: 10, z: 10 }
  })
})
