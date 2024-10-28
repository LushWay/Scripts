import { Container, ContainerSlot, Entity, ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import 'lib/extensions/player'

describe('minecraft/server mock', () => {
  it('should have container', () => {
    // @ts-expect-error
    const entity = new Entity() as Entity

    expect(entity.container).toBeInstanceOf(Container)
  })

  it('should set and get items from container', () => {
    // @ts-expect-error
    const entity = new Entity() as Entity

    const { container } = entity
    if (!container) throw new Error('No container')

    expect(container.getItem(0)).toBe(undefined)

    const item = new ItemStack(MinecraftItemTypes.Apple)
    container.setItem(0, item)
    expect(container.getItem(0)).toStrictEqual(item)

    expect(container.getSlot(0)).toBeInstanceOf(ContainerSlot)
    expect(container.getItem(0)).toStrictEqual(item)
  })
})
