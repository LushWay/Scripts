import { consoleLang } from 'lib/assets/lang'
import { textTable } from 'lib/i18n/text'
import { Vec } from 'lib/vector'
import { SphereArea } from './sphere'

describe('sphere', () => {
  it('should detect if vector is in region', () => {
    const sphere = new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 })

    sphere.isNear({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' }, 0)

    expect(sphere.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'overworld' })).toBe(true)
    expect(sphere.isIn({ location: { x: 0, y: 0, z: 0 }, dimensionType: 'nether' })).toBe(false)
    expect(sphere.isIn({ location: { x: 0, y: 3, z: 0 }, dimensionType: 'overworld' })).toBe(false)

    expect(sphere.edges).toEqual([
      { x: -1, y: -1, z: -1 },
      { x: 1, y: 1, z: 1 },
    ])

    sphere.radius = 10
    sphere.center = { x: 10, y: 10, z: 10 }
    expect(sphere.center).toEqual({ x: 10, y: 10, z: 10 })

    expect(textTable(sphere.getFormDescription()).to(consoleLang)).toMatchInlineSnapshot(`
      "§7Center: §f§c10 §a10 §b10
      §7Radius: §610"
    `)

    expect(sphere.toString()).toMatchInlineSnapshot(`"§7§f§c10 §a10 §b10§7 radius=§610§7"`)
  })

  it('should call forEachVector', async () => {
    const sphere = new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 3 }, 'overworld')
    const v = vi.fn()

    await sphere.forEachVector(v)

    const vOrder = v.mock.calls.map(e => e[1])

    expect(v.mock.calls.map(e => Vec.string(e[0]).padEnd(8, ' ') + ' -> ' + e[1])).toMatchInlineSnapshot(`
      [
        "-2 -2 -2 -> false",
        "-2 -2 -1 -> false",
        "-2 -2 0  -> true",
        "-2 -2 1  -> false",
        "-2 -2 2  -> false",
        "-2 -1 -2 -> false",
        "-2 -1 -1 -> true",
        "-2 -1 0  -> true",
        "-2 -1 1  -> true",
        "-2 -1 2  -> false",
        "-2 0 -2  -> true",
        "-2 0 -1  -> true",
        "-2 0 0   -> true",
        "-2 0 1   -> true",
        "-2 0 2   -> true",
        "-2 1 -2  -> false",
        "-2 1 -1  -> true",
        "-2 1 0   -> true",
        "-2 1 1   -> true",
        "-2 1 2   -> false",
        "-2 2 -2  -> false",
        "-2 2 -1  -> false",
        "-2 2 0   -> true",
        "-2 2 1   -> false",
        "-2 2 2   -> false",
        "-1 -2 -2 -> false",
        "-1 -2 -1 -> true",
        "-1 -2 0  -> true",
        "-1 -2 1  -> true",
        "-1 -2 2  -> false",
        "-1 -1 -2 -> true",
        "-1 -1 -1 -> true",
        "-1 -1 0  -> true",
        "-1 -1 1  -> true",
        "-1 -1 2  -> true",
        "-1 0 -2  -> true",
        "-1 0 -1  -> true",
        "-1 0 0   -> true",
        "-1 0 1   -> true",
        "-1 0 2   -> true",
        "-1 1 -2  -> true",
        "-1 1 -1  -> true",
        "-1 1 0   -> true",
        "-1 1 1   -> true",
        "-1 1 2   -> true",
        "-1 2 -2  -> false",
        "-1 2 -1  -> true",
        "-1 2 0   -> true",
        "-1 2 1   -> true",
        "-1 2 2   -> false",
        "0 -2 -2  -> true",
        "0 -2 -1  -> true",
        "0 -2 0   -> true",
        "0 -2 1   -> true",
        "0 -2 2   -> true",
        "0 -1 -2  -> true",
        "0 -1 -1  -> true",
        "0 -1 0   -> true",
        "0 -1 1   -> true",
        "0 -1 2   -> true",
        "0 0 -2   -> true",
        "0 0 -1   -> true",
        "0 0 0    -> true",
        "0 0 1    -> true",
        "0 0 2    -> true",
        "0 1 -2   -> true",
        "0 1 -1   -> true",
        "0 1 0    -> true",
        "0 1 1    -> true",
        "0 1 2    -> true",
        "0 2 -2   -> true",
        "0 2 -1   -> true",
        "0 2 0    -> true",
        "0 2 1    -> true",
        "0 2 2    -> true",
        "1 -2 -2  -> false",
        "1 -2 -1  -> true",
        "1 -2 0   -> true",
        "1 -2 1   -> true",
        "1 -2 2   -> false",
        "1 -1 -2  -> true",
        "1 -1 -1  -> true",
        "1 -1 0   -> true",
        "1 -1 1   -> true",
        "1 -1 2   -> true",
        "1 0 -2   -> true",
        "1 0 -1   -> true",
        "1 0 0    -> true",
        "1 0 1    -> true",
        "1 0 2    -> true",
        "1 1 -2   -> true",
        "1 1 -1   -> true",
        "1 1 0    -> true",
        "1 1 1    -> true",
        "1 1 2    -> true",
        "1 2 -2   -> false",
        "1 2 -1   -> true",
        "1 2 0    -> true",
        "1 2 1    -> true",
        "1 2 2    -> false",
        "2 -2 -2  -> false",
        "2 -2 -1  -> false",
        "2 -2 0   -> true",
        "2 -2 1   -> false",
        "2 -2 2   -> false",
        "2 -1 -2  -> false",
        "2 -1 -1  -> true",
        "2 -1 0   -> true",
        "2 -1 1   -> true",
        "2 -1 2   -> false",
        "2 0 -2   -> true",
        "2 0 -1   -> true",
        "2 0 0    -> true",
        "2 0 1    -> true",
        "2 0 2    -> true",
        "2 1 -2   -> false",
        "2 1 -1   -> true",
        "2 1 0    -> true",
        "2 1 1    -> true",
        "2 1 2    -> false",
        "2 2 -2   -> false",
        "2 2 -1   -> false",
        "2 2 0    -> true",
        "2 2 1    -> false",
        "2 2 2    -> false",
      ]
    `)

    const otherSphere = new SphereArea({ center: { x: -104, y: 10, z: 240 }, radius: 3 }, 'overworld')
    const otherV = vi.fn()
    await otherSphere.forEachVector(otherV)
    const otherVOrder = otherV.mock.calls.map(e => e[1])

    expect(vOrder).toEqual(otherVOrder)
  })
})
