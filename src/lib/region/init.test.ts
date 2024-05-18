import { describe, expect, it } from 'vitest'
import { RegionDatabase } from './database'
import { restoreRegionFromJSON } from './init'
import { RadiusRegion } from './kinds/RadiusRegion'

class TestRegion extends RadiusRegion {
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

describe('region initialization', () => {
  it('should restore right kind of region from json', () => {
    const region = TestRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 }, 'test')
    const json = region.json

    expect(json.t).toBe('r')
    expect(json.st).toBe(TestRegion.kind)

    expect(restoreRegionFromJSON(['test', json], [RadiusRegion, TestRegion])).toBeInstanceOf(TestRegion)
    expect(restoreRegionFromJSON(['test', json], [RadiusRegion, TestRegion])).toEqual(region)
  })

  it('should restore region from database', () => {
    const region = TestRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 })
    const regionJSON = RegionDatabase[region.regionKey]

    expect(regionJSON).toEqual(region.json)

    region.delete()
    expect(restoreRegionFromJSON(['test 2', regionJSON], [RadiusRegion, TestRegion])).toBeInstanceOf(TestRegion)
  })
})
