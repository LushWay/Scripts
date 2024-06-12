import { Vector } from 'lib/vector'
import { beforeAll, describe, expect, it } from 'vitest'
import { RegionDatabase } from './database'
import { restoreRegionFromJSON } from './init'
import { CubeRegion } from './kinds/CubeRegion'
import { RadiusRegion } from './kinds/RadiusRegion'

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

class TestCubeRegion extends CubeRegion {
  get regionKey() {
    return this.key
  }

  get json() {
    return this.toJSON()
  }
}

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

    expect(restoreRegionFromJSON(['test', json], [RadiusRegion, TestRadiusRegion])).toBeInstanceOf(TestRadiusRegion)
    expect(restoreRegionFromJSON(['test', json], [RadiusRegion, TestRadiusRegion])).toEqual(region)
  })

  it('should restore region from database', () => {
    const region = TestRadiusRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)

    region.delete()
    expect(restoreRegionFromJSON(['test 2', regionJSON], [RadiusRegion, TestRadiusRegion])).toBeInstanceOf(
      TestRadiusRegion,
    )
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

    expect(restoreRegionFromJSON(['test', region.json])).toBeInstanceOf(RadiusRegion)
  })
})
