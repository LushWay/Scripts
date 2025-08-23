import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib/vector'
import { TestStructures } from 'test/constants'
import { gamesuite, gametest } from 'test/framework'
import { SphereArea } from '../areas/sphere'
import { RegionWithStructure } from './with-structure'

class TestStructure extends RegionWithStructure {}

gamesuite('RegionWithStructure', () => {
  gametest('should save and load structure only with region blocks', async test => {
    const region = TestStructure.create(
      new SphereArea({ center: test.worldLocation(new Vec(2, 5, 2)), radius: 3 }, test.getDimension().type),
    )

    region.structure.save() // save empty structure with air
    await region.area.forEachVector((vector, isIn, dimension) => {
      dimension.setBlockType(vector, isIn ? MinecraftBlockTypes.Bedrock : MinecraftBlockTypes.Glass)
    })

    await test.idle(40)
    await region.structure.place()

    await region.area.forEachVector((vector, isIn) => {
      test.assertBlockPresent(isIn ? MinecraftBlockTypes.Air : MinecraftBlockTypes.Glass, test.worldLocation(vector))
    })

    test.succeed()
  })
    .structureName(TestStructures.flat)
    .maxTicks(400)
})
