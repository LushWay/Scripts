import { Region, RegionIsSaveable } from 'lib'
import { ChunkCubeArea } from './areas/chunk-cube'
import { SphereArea } from './areas/sphere'
import {
  RegionDatabase,
  RegionSave,
  registerSaveableRegion,
  restoreRegionFromJSON,
  TEST_clearSaveableRegions,
} from './database'

class TestK1Region extends Region {
  method() {}

  customProperty = 'string'

  get json() {
    return this.toJSON()
  }

  get regionKey() {
    return this.id
  }
}

class TestK2Region extends Region {
  get regionKey() {
    return this.id
  }

  get json() {
    return this.toJSON()
  }
}

beforeEach(() => {
  TEST_clearSaveableRegions()
  registerSaveableRegion('k2', TestK2Region)
  registerSaveableRegion('k1', TestK1Region)
})

afterAll(() => {
  TEST_clearSaveableRegions()
})

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
    const json = region.json as Immutable<RegionSave>

    expect(json.a.t).toBe(SphereArea.type)
    expect(json.k).toBe(TestK1Region.kind)

    expect(RegionIsSaveable in region).toBe(true)

    expect(restoreRegionFromJSON(['test', json])).toBeInstanceOf(TestK1Region)
    expect(restoreRegionFromJSON(['test', json])).toEqual(region)
  })

  it('should restore region from database', () => {
    const region = TestK1Region.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'))
    const regionJSON = RegionDatabase.getImmutable(region.regionKey)

    expect(regionJSON).toEqual(region.json)

    region.delete()
    expect(restoreRegionFromJSON(['test 2', regionJSON])).toBeInstanceOf(TestK1Region)
  })

  it('should restore cuberegion', () => {
    const region = TestK2Region.create(new ChunkCubeArea({ from: { x: 1, z: 1 }, to: { x: 1, z: 1 } }, 'overworld'))
    const regionJSON = RegionDatabase.getImmutable(region.regionKey)

    expect(regionJSON).toEqual(region.json)
    expect(restoreRegionFromJSON(['test', regionJSON])).toBeInstanceOf(TestK2Region)
  })

  it('should restore defult RadiusRegion when kind is unknown', () => {
    class OldRadiusRegionKind extends TestK1Region {
      static kind = 'unknown'
    }

    const region = OldRadiusRegionKind.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 2 }, 'overworld'))
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(restoreRegionFromJSON(['test', region.json as Immutable<RegionSave>])).toBeUndefined()
    expect(consoleWarn.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "§7[Region][Database] No kind found for §funknown§7. Available kinds: §fk2, k1§7. Maybe you forgot to register kind or import file?",
      ]
    `)
  })
})
