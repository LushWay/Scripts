import { RegionDatabase, registerSaveableRegion } from 'lib'
import { createPoint } from 'lib/utils/point'
import { Vec } from 'lib/vector'
import { TEST_clearDatabase, TEST_createPlayer } from 'test/utils'
import { SphereArea } from '../areas/sphere'
import { Region } from './region'

describe('Region', () => {
  beforeAll(() => {
    Region.regions = []
    TEST_clearDatabase(RegionDatabase)
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(0))
  })
  afterEach(() => {
    Region.regions = []
    TEST_clearDatabase(RegionDatabase)
    vi.useRealTimers()
  })

  it('should create region', () => {
    expect(Region.create(new SphereArea({ center: Vec.zero, radius: 0 }, 'overworld'))).toBeInstanceOf(Region)
  })

  it('should create regions with different ids', () => {
    vi.setSystemTime(new Date(0))
    class T extends Region {}
    registerSaveableRegion('t', T)
    const area = new SphereArea({ center: Vec.zero, radius: 0 }, 'overworld')

    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00"`)
    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00-0"`)
    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00-1"`)
    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00-2"`)
    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00-3"`)
    expect(T.create(area).id).toMatchInlineSnapshot(`"t-s-0-01-01-1970-00:00-4"`)
  })

  it('should return owner name', () => {
    const player = TEST_createPlayer()
    const region = Region.create(new SphereArea({ center: Vec.zero, radius: 0 }, 'overworld'), {
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
    expect(TestRegion.getAt(createPoint(0.4, 0.4, 0.4))).toBe(region)

    expectTypeOf(TestRegion.getManyAt(createPoint(0, 0, 0))).toEqualTypeOf<TestRegion[]>()
  })
})
