import { world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib/vector'
import { TestStructures } from 'test/constants'
import { suite, test } from 'test/framework'
import { RadiusRegionWithStructure } from './RadiusRegionWithStructure'

suite('RadiusRegionWithStructure', () => {
  test('should save and load structure only with region blocks', async test => {
    const region = RadiusRegionWithStructure.create({
      dimensionId: test.getDimension().type,
      center: test.worldLocation(new Vector(2, 5, 2)),
      radius: 3,
    })

    region.saveStructure() // save empty structure with air

    const locations = Vector.foreach(...Vector.around(region.center, region.radius))
    let i = 0
    for (const location of locations) {
      const isIn = region.isVectorInRegion(location, region.dimensionId)
      world[region.dimensionId].setBlockType(location, isIn ? MinecraftBlockTypes.Bedrock : MinecraftBlockTypes.Glass)
      i++
      if (i % 5 === 0) await test.idle(1)
    }

    await test.idle(40)

    await region.loadStructure()

    for (const location of locations) {
      const isIn = region.isVectorInRegion(location, region.dimensionId)
      test.assertBlockPresent(isIn ? MinecraftBlockTypes.Air : MinecraftBlockTypes.Glass, test.worldLocation(location))
    }

    test.succeed()
  })
    .structureName(TestStructures.flat)
    .maxTicks(400)
})
