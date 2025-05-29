import { system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Vec } from 'lib'
import { gamesuite, gametest } from 'test/framework'
import { Temporary } from './temporary'

gamesuite('temporary', () => {
  gametest('should unsubscribe afterEvents', async test => {
    const blockLocation = new Vec(0, 3, 0)
    const worldLocation = test.worldLocation(blockLocation)

    test.setBlockType(MinecraftBlockTypes.GrassBlock, blockLocation)
    new Temporary(({ world, cleanup }) => {
      world.beforeEvents.explosion.subscribe(event => {
        if (event.getImpactedBlocks().find(e => Vec.string(worldLocation) === Vec.string(e.location))) {
          event.cancel = true
          system.delay(() => {
            cleanup()
          })
        }
      })
    })

    test.getDimension().createExplosion(worldLocation, 2)
    test.assertBlockPresent(MinecraftBlockTypes.GrassBlock, blockLocation, true) // Event should be canceled once

    await test.idle(10)
    test.getDimension().createExplosion(worldLocation, 2)
    test.succeedWhen(() => {
      test.assertBlockPresent(MinecraftBlockTypes.GrassBlock, blockLocation, false) // Event should be not canceled
    })
  })
})
