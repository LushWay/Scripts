import 'lib/load/extensions'

import 'lib/database/player'
import { Vector } from 'lib/vector'
import { describe, expect, it } from 'vitest'
import { RegionDatabase } from '../database'
import { SafeAreaRegion } from './SafeAreaRegion'

class TestSafeAreaRegion extends SafeAreaRegion {
  get regionKey() {
    return this.key
  }
}

describe('SafeAreaRegion', () => {
  it('should not save region to database', () => {
    const region = TestSafeAreaRegion.create({ center: Vector.one, dimensionId: 'overworld', radius: 1 })

    expect(RegionDatabase[region.regionKey]).toBe(undefined)
  })

  it('should have safe area name', () => {
    const region = TestSafeAreaRegion.create({
      center: Vector.one,
      dimensionId: 'overworld',
      radius: 1,
      safeAreaName: 'Safe area name',
    })

    expect(region.name).toMatchInlineSnapshot(`"Безопасная зона Safe area name"`)
  })
})
