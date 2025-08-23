import { Vec } from 'lib/vector'
import { SphereArea } from '../areas/sphere'
import { RegionDatabase } from '../database'
import { SafeAreaRegion } from './safe-area'

class TestSafeAreaRegion extends SafeAreaRegion {
  get regionKey() {
    return this.id
  }
}

describe('SafeAreaRegion', () => {
  it('should not save region to database', () => {
    const region = TestSafeAreaRegion.create(new SphereArea({ center: Vec.one, radius: 1 }, 'overworld'))

    expect(region.regionKey in RegionDatabase).toBe(false)
  })

  it('should have safe area name', () => {
    const region = TestSafeAreaRegion.create(new SphereArea({ center: Vec.one, radius: 1 }, 'overworld'), {
      safeAreaName: 'Safe area name',
    })

    expect(region.name).toMatchInlineSnapshot(`"Безопасная зона Safe area name"`)
  })
})
