import { Vector } from 'lib/vector'
import { SphereArea } from '../areas/sphere'
import { BossArenaRegion } from './boss-arena'

describe('BossArenaRegion', () => {
  it('should create region', () => {
    const region = BossArenaRegion.create(new SphereArea({ center: Vector.one, radius: 1 }, 'overworld'), {
      bossName: 'Abc',
    })

    expect(region).toBeInstanceOf(BossArenaRegion)
    expect(region.displayName).toMatchInlineSnapshot(`"§cБосс §6Abc"`)
  })
})
