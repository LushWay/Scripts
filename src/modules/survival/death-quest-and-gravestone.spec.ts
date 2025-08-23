import { ItemStack, ItemTypes } from '@minecraft/server'
import { TestStructures } from 'test/constants'
import { gamesuite, gametest } from 'test/framework'
import { gravestoneEntityTypeId } from './death-quest-and-gravestone'

gamesuite('death-quest-and-gravestone', () => {
  gametest('save-inventory', async test => {
    const location = { x: 3, y: 2, z: 3 }
    const player = test.spawnSimulatedPlayer(location)

    const { container } = player
    if (!container) throw new Error('Player has no container')

    const items: ItemStack[] = []
    const allItems = ItemTypes.getAll()
    for (const [i] of container.entries()) {
      const item = new ItemStack(allItems.randomElement(), 1)

      container?.setItem(i, item)
      items[i] = item
    }

    test.assert(container.emptySlotsCount === 0, 'container is not full')
    test.print('loaded ' + container?.size + ' items')
    await test.idle(20)

    player.kill()
    await test.idle(20)

    const entities = test.getDimension().getEntities({ location: test.relativeLocation(location), maxDistance: 4 })
    test.assert(entities.length === 0, 'no entities present')

    const entity = entities.find(e => e.typeId === gravestoneEntityTypeId)
    if (!entity) throw new Error('no gravestone entity found')
    await test.idle(400)
  }).structureName(TestStructures.flat)
})
