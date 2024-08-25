import { Region } from 'lib'
import { Vector } from 'lib/vector'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ChunkCubeArea } from './areas/chunk-cube'
import { SphereArea } from './areas/sphere'
import { RegionDatabase, registerSaveableRegion, restoreRegionFromJSON } from './database'

class TestK1Region extends Region {
  method() {}

  customProperty = 'string'

  get json() {
    return this.toJSON()
  }

  get regionKey() {
    return this.key
  }

  get isSabeable() {
    return this.saveable
  }
}
registerSaveableRegion('k1', TestK1Region)

class TestK2Region extends Region {
  get regionKey() {
    return this.key
  }

  get json() {
    return this.toJSON()
  }
}
registerSaveableRegion('k2', TestK2Region)

beforeAll(() => {
  TestK1Region.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'))
})

describe('region initialization', () => {
  it('should restore right kind of region from json', () => {
    const region = TestK1Region.create(
      new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'),
      {},
      'test',
    )
    const json = region.json

    expect(json.a.t).toBe(SphereArea.type)
    expect(json.k).toBe(TestK1Region.kind)

    expect(region.isSabeable).toBe(true)

    expect(restoreRegionFromJSON(['test', json])).toBeInstanceOf(TestK1Region)
    expect(restoreRegionFromJSON(['test', json])).toEqual(region)
  })

  it('should restore region from database', () => {
    const region = TestK1Region.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'))
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)

    region.delete()
    expect(restoreRegionFromJSON(['test 2', regionJSON])).toBeInstanceOf(TestK1Region)
  })

  it('should restore cuberegion', () => {
    const region = TestK2Region.create(new ChunkCubeArea({ from: Vector.one, to: Vector.one }, 'overworld'))
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)
    expect(restoreRegionFromJSON(['test', regionJSON])).toBeInstanceOf(TestK2Region)
  })

  it('should restore defult RadiusRegion when kind is unknown', () => {
    class OldRadiusRegionKind extends TestK1Region {
      static kind = 'unknown'
    }

    const region = OldRadiusRegionKind.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'))
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(restoreRegionFromJSON(['test', region.json])).toBeUndefined()
    expect(consoleWarn.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§7[Region][Database] No kind found for §funknown§7. Maybe you forgot to register kind or import file?§7",
      ]
    `)
  })
})
