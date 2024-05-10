import { describe, expect, it } from 'vitest'
// @ts-ignore AAAAAA
import { restoreRegionFromJSON } from './init'
import { MineshaftRegion } from './kinds/MineshaftRegion'

describe('region initialization', () => {
  it('should restore right kind of region from json', () => {
    const key = 'mineshaft'
    const region = MineshaftRegion.create({ center: { x: 0, y: 0, z: 0 }, dimensionId: 'overworld', radius: 2 }, key)

    //@ts-expect-error Because is a test
    const json = region.toJSON()

    expect(json.t).toBe('r')
    expect(json.st).toBe(MineshaftRegion.kind)
    expect(restoreRegionFromJSON([key, json])).toBeInstanceOf(MineshaftRegion)
  })
})
