import { ItemStack } from '@minecraft/server'
import type { ExtendedTest } from '@minecraft/server-gametest'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { TestStructures } from 'test/constants'
import { suite, test } from 'test/framework'
import { BASE_ITEM_STACK } from './base'

suite('base', () => {
  test('region-defence', async test => {
    const { owner, raider } = await createCommonBaseTest(test)

    await test.idle(20)
    const glassLocation = { x: 2, y: 2, z: 1 }
    owner.useItemOnBlock(new ItemStack(MinecraftItemTypes.Glass), glassLocation)
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, true)

    raider.breakBlock(glassLocation)
    await test.idle(20)
    raider.stopBreakingBlock()
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, true)
    await test.idle(10)

    owner.breakBlock(glassLocation)
    await test.idle(20)
    test.assertBlockPresent(MinecraftBlockTypes.Glass, glassLocation, false)
    raider.stopBreakingBlock()
    await test.idle(10)

    test.succeed()
  }).structureName(TestStructures.flat)
})

async function createCommonBaseTest(test: ExtendedTest) {
  const owner = test.spawnSimulatedPlayer({ x: 0, y: 3, z: 0 }, 'Base owner')
  const raider = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 0 }, 'Raider')

  owner.mainhand().setItem(BASE_ITEM_STACK)
  await test.idle(10)
  owner.useItemInSlotOnBlock(owner.selectedSlot, { x: 2, y: 2, z: 2 })
  owner.mainhand().setItem(new ItemStack('minecraft:air'))

  return { owner, raider }
}
