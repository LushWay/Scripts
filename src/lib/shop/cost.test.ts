import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import 'lib/extensions/player'

import 'lib/database/player'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Cost, ItemCost, MoneyCost, MultiCost } from './cost'

describe('cost', () => {
  it('should create item cost', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const cost = new ItemCost(MinecraftItemTypes.Apple, 2)

    new MultiCost(new MoneyCost(100), new ItemCost(new ItemStack(MinecraftItemTypes.Apple)))

    expect(cost.has(player)).toBe(false) // 0 items

    addItem()
    expect(cost.has(player)).toBe(false) // 1 item

    addItem()
    expect(cost.has(player)).toBe(true) // 2 item, true

    addItem()
    expect(cost.has(player)).toBe(true) // 3 item, true

    cost.buy(player)
    expect(cost.has(player)).toBe(false) // 1 item

    addItem()
    expect(cost.has(player)).toBe(true) // 2 item, true

    function addItem() {
      player.container?.addItem(new ItemStack(MinecraftItemTypes.Apple))
    }
  })

  it('should allow empty multicost', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const cost = new MultiCost()

    expect(cost.has(player)).toBe(true)
    expect(cost.buy(player)).toEqual([])
  })

  it('should take items', () => {
    // @ts-expect-error
    const player = new Player() as Player
    const cost = new ItemCost(MinecraftItemTypes.Apple, 2)

    expect(cost.has(player)).toBe(false) // 0 items

    addItem()
    expect(cost.has(player)).toBe(false) // 1 item

    addItem()
    expect(cost.has(player)).toBe(true) // 2 item, true

    addItem()
    expect(cost.has(player)).toBe(true) // 3 item, true

    cost.buy(player)
    expect(cost.has(player)).toBe(false) // 1 item

    addItem()
    expect(cost.has(player)).toBe(true) // 2 item, true

    function addItem() {
      player.container?.addItem(new ItemStack(MinecraftItemTypes.Apple))
    }
  })
})

describe('MultiCost', () => {
  class StringCost extends Cost<string> {
    toString() {
      return ''
    }
    has() {
      return true
    }
  }
  class NumberCost extends Cost<number> {
    toString() {
      return ''
    }
    has() {
      return true
    }
  }

  it('should have types', () => {
    // @ts-expect-error
    const player = new Player() as Player

    const multicost = new MultiCost(new StringCost(), new NumberCost(), new NumberCost()).buy(player)
    expectTypeOf(multicost[0]).toBeString()
    expectTypeOf(multicost[1]).toBeNumber()
    expectTypeOf(multicost[2]).toBeNumber()

    // @ts-expect-error
    expectTypeOf(multicost[4]).toBeString()
    // @ts-expect-error
    expectTypeOf(multicost[2]).toBeString()
  })

  it('should combine multiple multicosts', () => {
    // @ts-expect-error
    const player = new Player() as Player

    const multicost = new MultiCost(new StringCost(), new MultiCost(new NumberCost(), new NumberCost())).buy(player)
    expectTypeOf(multicost[0]).toBeString()
    expectTypeOf(multicost[1][0]).toBeNumber()
    expectTypeOf(multicost[1][1]).toBeNumber()

    // @ts-expect-error
    expectTypeOf(multicost[4]).toBeString()
    // @ts-expect-error
    expectTypeOf(multicost[2]).toBeString()
  })
})
