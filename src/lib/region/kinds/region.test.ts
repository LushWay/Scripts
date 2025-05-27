import { createPoint } from 'lib/utils/point'
import { Vector } from 'lib/vector'
import { TEST_createPlayer } from 'test/utils'
import { SphereArea } from '../areas/sphere'
import { Region } from './region'

describe('Region', () => {
  beforeEach(() => (Region.regions = []))
  afterEach(() => (Region.regions = []))

  it('should create region', () => {
    expect(Region.create(new SphereArea({ center: Vector.zero, radius: 0 }, 'overworld'))).toBeInstanceOf(Region)
  })

  it('should return owner name', () => {
    const player = TEST_createPlayer()
    const region = Region.create(new SphereArea({ center: Vector.zero, radius: 0 }, 'overworld'), {
      permissions: { owners: [player.id] },
    })

    expect(region.ownerName).toBe(player.name)
  })

  it('should return instances of right type', () => {
    class TestRegion extends Region {}
    class AnotherTestRegion extends Region {}

    expect(Region.regions.length).toBe(0)
    expect(TestRegion.regions.length).toBe(0)
    expect(AnotherTestRegion.regions.length).toBe(0)

    const region = TestRegion.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 1 }))
    AnotherTestRegion.create(new SphereArea({ center: { x: 0, y: 0, z: 0 }, radius: 1 }))

    expect(Region.regions.length).toBe(2)
    expect(TestRegion.regions.length).toBe(1)
    expect(AnotherTestRegion.regions.length).toBe(1)

    expect(region).toBeInstanceOf(TestRegion)
    expectTypeOf(region).toEqualTypeOf<TestRegion>()

    expectTypeOf(TestRegion.getAll()).toEqualTypeOf<TestRegion[]>()
    expect(TestRegion.getAll().length).toBe(1)
    expect(TestRegion.getAll()[0]).toBe(region)

    expectTypeOf(TestRegion.getAt(createPoint(0, 0, 0))).toEqualTypeOf<TestRegion | undefined>()
    expect(TestRegion.getAt(createPoint(0, 0, 0))).toBe(region)

    expectTypeOf(TestRegion.getManyAt(createPoint(0, 0, 0))).toEqualTypeOf<TestRegion[]>()
  })
})
