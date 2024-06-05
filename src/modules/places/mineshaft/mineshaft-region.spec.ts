import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { Vector } from 'lib'
import { TestStructures } from 'test/constants'
import { suite, test } from 'test/framework'
import './mineshaft'
import { MineshaftRegion } from './mineshaft-region'

class TestMineshaftRegion extends MineshaftRegion {
  get regionEdges() {
    return this.edges
  }

  create() {
    this.onCreate()
  }
}

suite('MineshaftRegion', () => {
  test('Ore', async test => {
    const region = TestMineshaftRegion.create({
      dimensionId: test.getDimension().type,
      center: test.worldLocation(new Vector(5, 20, 5)),
      radius: 20,
    })

    await region.forEachVector((vector, isIn, dimension) => {
      if (isIn) dimension.setBlockType(vector, b.Stone)
    })
    region.create()
  })
    .structureName(TestStructures.flat)
    .padding(10)
    .maxTicks(100000)
})
