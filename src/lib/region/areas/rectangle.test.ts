import { createPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { RectangleArea } from './rectangle'

describe('rectangle', () => {
  it('should detect if vector is in region', () => {
    const rect = new RectangleArea({ from: { x: 0, y: 0, z: 0 }, to: { x: 10, y: 10, z: 10 } }, 'overworld')

    expect(rect.isIn({ vector: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(rect.isIn({ vector: { x: 1, y: 1, z: 1 }, dimensionType: 'overworld' })).toBe(true)

    expect(rect.isIn(createPoint(0, 0, 0, 'nether'))).toBe(false)
    expect(rect.isIn(createPoint(0, 11, 0))).toBe(false)

    expect(rect.center).toEqual({ x: 5, y: 5, z: 5 })
    expect(rect.isNear(createPoint(15, 15, 15), 5)).toBe(true)
  })

  it('should have center', () => {
    const rect = new RectangleArea({ from: { x: 10, y: 10, z: 10 }, to: { x: 20, y: 20, z: 20 } }, 'overworld')

    expect(rect.edges).toMatchInlineSnapshot(`
      [
        Vec {
          "x": 10,
          "y": 10,
          "z": 10,
        },
        Vec {
          "x": 20,
          "y": 20,
          "z": 20,
        },
      ]
    `)

    expect(rect.center).toMatchInlineSnapshot(`
      Vec {
        "x": 15,
        "y": 15,
        "z": 15,
      }
    `)
  })

  it('should have negative center', () => {
    const rect = new RectangleArea({ from: { x: -10, y: -10, z: -10 }, to: { x: -20, y: -20, z: -20 } }, 'overworld')

    expect(rect.edges).toMatchInlineSnapshot(`
      [
        Vec {
          "x": -20,
          "y": -20,
          "z": -20,
        },
        Vec {
          "x": -10,
          "y": -10,
          "z": -10,
        },
      ]
    `)

    expect(rect.center).toMatchInlineSnapshot(`
      Vec {
        "x": -15,
        "y": -15,
        "z": -15,
      }
    `)
  })

  it('should call forEachVector', async () => {
    const rect = new RectangleArea({ from: { x: 0, y: 0, z: 0 }, to: { x: 2, y: 3, z: 2 } }, 'overworld')
    const v = vi.fn()

    try {
      await rect.forEachVector(() => {
        throw new Error('Test')
      })
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Test]`)
    }

    await rect.forEachVector(v)
    expect(v.mock.calls.map(e => Vec.string(e[0]) + ' -> ' + e[1])).toMatchInlineSnapshot(`
      [
        "0 0 0 -> true",
        "0 0 1 -> true",
        "0 0 2 -> true",
        "0 1 0 -> true",
        "0 1 1 -> true",
        "0 1 2 -> true",
        "0 2 0 -> true",
        "0 2 1 -> true",
        "0 2 2 -> true",
        "0 3 0 -> true",
        "0 3 1 -> true",
        "0 3 2 -> true",
        "1 0 0 -> true",
        "1 0 1 -> true",
        "1 0 2 -> true",
        "1 1 0 -> true",
        "1 1 1 -> true",
        "1 1 2 -> true",
        "1 2 0 -> true",
        "1 2 1 -> true",
        "1 2 2 -> true",
        "1 3 0 -> true",
        "1 3 1 -> true",
        "1 3 2 -> true",
        "2 0 0 -> true",
        "2 0 1 -> true",
        "2 0 2 -> true",
        "2 1 0 -> true",
        "2 1 1 -> true",
        "2 1 2 -> true",
        "2 2 0 -> true",
        "2 2 1 -> true",
        "2 2 2 -> true",
        "2 3 0 -> true",
        "2 3 1 -> true",
        "2 3 2 -> true",
      ]
    `)
  })
})
