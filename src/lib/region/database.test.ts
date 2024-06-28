import { Vector } from 'lib/vector'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { RegionDatabase, registerRegionKind, restoreRegionFromJSON } from './database'
import { CubeRegion } from './kinds/cube'
import { RadiusRegion } from './kinds/radius'

class TestRadiusRegion extends RadiusRegion {
  static kind = 'test'

  method() {}

  customProperty = 'string'

  get json() {
    return this.toJSON()
  }

  get regionKey() {
    return this.key
  }
}
registerRegionKind(TestRadiusRegion)

class TestCubeRegion extends CubeRegion {
  get regionKey() {
    return this.key
  }

  get json() {
    return this.toJSON()
  }
}
registerRegionKind(TestCubeRegion)

beforeAll(() => {
  TestRadiusRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })
})

describe('region initialization', () => {
  it('should restore right kind of region from json', () => {
    const region = TestRadiusRegion.create(
      { center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 },
      'test',
    )
    const json = region.json

    expect(json.t).toBe('r')
    expect(json.st).toBe(TestRadiusRegion.kind)

    expect(restoreRegionFromJSON(['test', json])).toBeInstanceOf(TestRadiusRegion)
    expect(restoreRegionFromJSON(['test', json])).toEqual(region)
  })

  it('should restore region from database', () => {
    const region = TestRadiusRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)

    region.delete()
    expect(restoreRegionFromJSON(['test 2', regionJSON])).toBeInstanceOf(TestRadiusRegion)
  })

  it('should restore cuberegion', () => {
    const region = TestCubeRegion.create({ from: Vector.one, to: Vector.one, dimensionId: 'overworld' })
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)
    expect(restoreRegionFromJSON(['test', regionJSON])).toBeInstanceOf(CubeRegion)
  })

  it('should restore defult RadiusRegion when kind is unknown', () => {
    class OldRadiusRegionKind extends TestRadiusRegion {
      static kind = 'unknown'
    }

    const region = OldRadiusRegionKind.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })

    const consoleWarn = vi.spyOn(console, 'warn')
    expect(restoreRegionFromJSON(['test', region.json])).toBeUndefined()
    expect(consoleWarn.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§7[Region][Database] No kind found for §fr§7 -> §funknown§7. Maybe you forgot to register kind or import file?§7",
      ]
    `)
  })
})
