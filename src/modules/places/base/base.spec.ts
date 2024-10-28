import { ItemStack } from '@minecraft/server'
import type { ExtendedSimulatedPlayer, ExtendedTest } from '@minecraft/server-gametest'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { TestStructures } from 'test/constants'
import { gamesuite, gametest } from 'test/framework'
import { BaseItem } from './base'

gamesuite('base', () => {
  gametest('should break blocks only by region owner', async test => {
    const { owner, raider } = await createCommonBaseTest(test)

    await test.idle(20)
    const glassLocation = { x: 2, y: 2, z: 1 }
    owner.useItemOnBlock(new ItemStack(MinecraftItemTypes.Glass), glassLocation)
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, true)

    await expectBlockStateAfterBreakingBy(test, raider, glassLocation, BlockState.NotBroken)
    await expectBlockStateAfterBreakingBy(test, owner, glassLocation, BlockState.Broken)

    test.succeed()
  })
    .structureName(TestStructures.flat)
    .padding(40)

  gametest('should remove base after explosion', async test => {
    const { owner, raider } = await createCommonBaseTest(test)

    await test.idle(20)
    const glassLocation = { x: 2, y: 2, z: 1 }
    owner.useItemOnBlock(new ItemStack(MinecraftItemTypes.Glass), glassLocation)
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, true)

    await expectBlockStateAfterBreakingBy(test, raider, glassLocation, BlockState.NotBroken)

    test.getDimension().createExplosion(test.worldLocation(glassLocation), 2)
    await test.idle(20)
    owner.useItemOnBlock(new ItemStack(MinecraftItemTypes.Glass), glassLocation)
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, true)

    await expectBlockStateAfterBreakingBy(test, raider, glassLocation, BlockState.Broken)

    test.succeed()
  })
    .structureName(TestStructures.flat)
    .padding(40)
    .maxTicks(200)
})

enum BlockState {
  Broken,
  NotBroken,
}

async function expectBlockStateAfterBreakingBy(
  test: ExtendedTest,
  player: ExtendedSimulatedPlayer,
  glassLocation: Vector3,
  present: BlockState,
) {
  player.breakBlock(glassLocation)
  await test.idle(20)
  test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, present === BlockState.Broken ? false : true)
  player.stopBreakingBlock()
  await test.idle(10)
}

async function createCommonBaseTest(test: ExtendedTest) {
  const owner = test.spawnSimulatedPlayer({ x: 0, y: 3, z: 0 }, 'Base owner')
  const raider = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 0 }, 'Raider')

  owner.mainhand().setItem(BaseItem.itemStack)
  await test.idle(10)
  owner.useItemInSlotOnBlock(owner.selectedSlotIndex, { x: 2, y: 2, z: 2 })
  owner.mainhand().setItem(new ItemStack('minecraft:air'))

  return { owner, raider }
}
