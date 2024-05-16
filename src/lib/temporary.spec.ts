import { Vector, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { suite, test } from 'test/framework'
import { Temporary } from './temporary'

suite('temporary', () => {
  test('should unsubscribe afterEvents', async test => {
    const blockLocation = new Vector(0, 3, 0)
    const worldLocation = test.worldLocation(blockLocation)

    test.setBlockType(MinecraftBlockTypes.Grass, blockLocation)
    new Temporary(({ world, cleanup }) => {
      world.beforeEvents.explosion.subscribe(event => {
        if (event.getImpactedBlocks().find(e => Vector.string(worldLocation) === Vector.string(e.location))) {
          event.cancel = true
          system.delay(() => {
            cleanup()
          })
        }
      })
    })

    test.getDimension().createExplosion(worldLocation, 2)
    test.assertBlockPresent(MinecraftBlockTypes.Grass, blockLocation, true) // Event should be canceled once

    await test.idle(10)
    test.getDimension().createExplosion(worldLocation, 2)
    test.succeedWhen(() => {
      test.assertBlockPresent(MinecraftBlockTypes.Grass, blockLocation, false) // Event should be not canceled
    })

  })
})
