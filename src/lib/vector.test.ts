import { Vec } from './vector'

describe('vector extra functions', () => {
  it('should create around vectors', () => {
    expect(Vec.around(Vec.zero, 5)).toEqual([new Vec(-5, -5, -5), new Vec(5, 5, 5)])
    expect(Vec.around({ x: 10, y: 0, z: -5 }, 5)).toEqual([new Vec(5, -5, -10), new Vec(15, 5, 0)])
  })

  it('should parse', () => {
    expect(Vec.parse('-2431 231 543')).toMatchInlineSnapshot(`
      Vec {
        "x": -2431,
        "y": 231,
        "z": 543,
      }
    `)
  })
})
