import { createPoint } from 'lib/utils/point'
import { FlattenedSphereArea } from './flattened-sphere'

describe('rectangle', () => {
  it('should detect if vector is in region', () => {
    const flts = new FlattenedSphereArea({ center: { x: 0, y: 0, z: 0 }, rx: 10, ry: 2 }, 'overworld')

    expect(flts.isIn(createPoint(0, 0, 0))).toBe(true)
    expect(flts.isIn(createPoint(0, 2, 0))).toBe(true)
    expect(flts.isIn(createPoint(10, 1, 0))).toBe(true)
    expect(flts.isIn(createPoint(9, 1, 1))).toBe(true)

    expect(flts.isIn(createPoint(10, 1, 10))).toBe(false)
    expect(flts.isIn(createPoint(10, 1, 0, 'nether'))).toBe(false)
    expect(flts.isIn(createPoint(0, 3, 0))).toBe(false)

    expect(flts.center).toEqual({ x: 0, y: 0, z: 0 })
    expect(flts.isNear(createPoint(12, 0, 0), 2)).toBe(true)
    expect(flts.isNear(createPoint(12, 0, 0), 1)).toBe(false)

    expect(flts.edges).toEqual([
      { x: -10, y: -2, z: -10 },
      { x: 10, y: 2, z: 10 },
    ])

    expect(flts.radius).toBe(10)

    flts.rx = 12
    flts.ry = 20

    expect(flts.radius).toBe(20)

    flts.center = { x: 10, y: 10, z: 10 }

    expect(flts.getFormDescription()).toMatchInlineSnapshot(`
      {
        "Center": "§c10 §a10 §b10",
        "Radius": 12,
        "YRadius": 20,
      }
    `)
  })
})
