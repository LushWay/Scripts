import 'lib/database/player'
import 'lib/load/extensions'

import { Vector } from 'lib/vector'
import { describe, expect, it } from 'vitest'
import { SphereArea } from '../areas/sphere'
import { RegionDatabase } from '../database'
import { SafeAreaRegion } from './safe-area'

class TestSafeAreaRegion extends SafeAreaRegion {
  get regionKey() {
    return this.key
  }
}

describe('SafeAreaRegion', () => {
  it('should not save region to database', () => {
    const region = TestSafeAreaRegion.create(new SphereArea({ center: Vector.one, radius: 1 }, 'overworld'))

    expect(region.regionKey in RegionDatabase).toBe(false)
  })

  it('should have safe area name', () => {
    const region = TestSafeAreaRegion.create(new SphereArea({ center: Vector.one, radius: 1 }, 'overworld'), {
      safeAreaName: 'Safe area name',
    })

    expect(region.name).toMatchInlineSnapshot(`"Безопасная зона Safe area name"`)
  })
})
