import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import 'lib/extensions/player'
import { describe, expect, it } from 'vitest'
import { ItemCost } from './cost'

describe('cost', () => {
  it('should create item cost', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const cost = new ItemCost(MinecraftItemTypes.Apple, 2)

    expect(cost.check(player)).toBe(false) // 0 items

    addItem()
    expect(cost.check(player)).toBe(false) // 1 item

    addItem()
    expect(cost.check(player)).toBe(true) // 2 item, true

    addItem()
    expect(cost.check(player)).toBe(true) // 3 item, true

    cost.buy(player)
    expect(cost.check(player)).toBe(false) // 1 item

    addItem()
    expect(cost.check(player)).toBe(true) // 2 item, true

    function addItem() {
      player.container?.addItem(new ItemStack(MinecraftItemTypes.Apple))
    }
  })
})
