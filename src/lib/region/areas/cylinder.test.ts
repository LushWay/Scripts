import { CylinderArea } from './cylinder'

describe('cylinder', () => {
  it('should detect if vector is in region', () => {
    const cylinder = new CylinderArea({
      center: { x: 0, y: 0, z: 0 },
      radius: 2,
      yradius: 3,
    })

    expect(cylinder.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(cylinder.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(cylinder.isIn({ location: { x: 1, y: 2, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(cylinder.isIn({ location: { x: 0, y: 4, z: 0 }, dimensionType: 'overworld' })).toBe(false)
    expect(cylinder.isIn({ location: { x: 0, y: 0, z: 3 }, dimensionType: 'overworld' })).toBe(false)
    expect(cylinder.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'nether' })).toBe(false)

    expect(cylinder.edges).toEqual([
      { x: -1, y: -2, z: -1 },
      { x: 1, y: 2, z: 1 },
    ])

    cylinder.radius = 5
    cylinder.center = { x: 10, y: 10, z: 10 }
    expect(cylinder.center).toEqual({ x: 10, y: 10, z: 10 })

    expect(cylinder.getFormDescription()).toMatchInlineSnapshot(`
      {
        "Center": "§c10 §a10 §b10",
        "Radius": 5,
        "YRadius": 3,
      }
    `)
  })

  it('should detect if vector is in region 2', () => {
    const cylinder = new CylinderArea({
      center: { x: 10, y: 10, z: 10 },
      radius: 10,
      yradius: 20,
    })

    expect(cylinder.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(false)
    expect(cylinder.isIn({ location: { x: 5, y: 5, z: 5 }, dimensionType: 'overworld' })).toBe(true)
    expect(cylinder.isIn({ location: { x: 5, y: 19, z: 5 }, dimensionType: 'overworld' })).toBe(true)
    expect(cylinder.isIn({ location: { x: 10, y: 19, z: 19 }, dimensionType: 'overworld' })).toBe(true)
  })

  it('should detect isNear with distance', () => {
    const cylinder = new CylinderArea({
      center: { x: 0, y: 0, z: 0 },
      radius: 2,
      yradius: 3,
    })

    // Just outside the cylinder, but within distance 1
    expect(cylinder.isNear({ location: { x: 2, y: 0, z: 0 }, dimensionType: 'overworld' }, 1)).toBe(true)
    // Well outside the cylinder
    expect(cylinder.isNear({ location: { x: 10, y: 0, z: 0 }, dimensionType: 'overworld' }, 1)).toBe(false)
    // Above the cylinder, but within distance
    expect(cylinder.isNear({ location: { x: 0, y: 4, z: 0 }, dimensionType: 'overworld' }, 2)).toBe(true)
    // Wrong dimension
    expect(cylinder.isNear({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'end' }, 1)).toBe(false)
  })
})
