import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { SphereArea } from 'lib/region/areas/sphere'
import { Vec } from 'lib/vector'
import { TestStructures } from 'test/constants'
import { gamesuite, gametest } from 'test/framework'
import { MineshaftRegion } from './mineshaft-region'

class TestMineshaftRegion extends MineshaftRegion {
  get regionEdges() {
    return this.area.edges
  }

  create() {
    this.onCreate()
  }
}

gamesuite('MineshaftRegion', () => {
  gametest('Ore', async test => {
    const region = TestMineshaftRegion.create(
      new SphereArea({ center: test.worldLocation(new Vec(5, 20, 5)), radius: 20 }, test.getDimension().type),
    )

    await region.area.forEachVector((vector, isIn, dimension) => {
      if (isIn) dimension.setBlockType(vector, b.Stone)
    })
    region.create()
  })
    .structureName(TestStructures.flat)
    .padding(10)
    .maxTicks(100000)
})
