import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { TEST_createPlayer } from 'test/utils'
import { Cost, ItemCost, MultiCost } from './cost'

describe('cost', () => {
  it('should create item cost', () => {
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

    cost.take(player)
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
    expect(cost.take(player)).toEqual([])
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

    cost.take(player)
    expect(cost.has(player)).toBe(false) // 1 item

    addItem()
    expect(cost.has(player)).toBe(true) // 2 item, true

    function addItem() {
      player.container?.addItem(new ItemStack(MinecraftItemTypes.Apple))
    }
  })
})

describe('MultiCost', () => {
  it('should stringify', () => {
    const player = TEST_createPlayer()
    const cost = new MultiCost().money(1000).item(MinecraftItemTypes.Apple).item(MinecraftItemTypes.NetheriteAxe).xp(10)

    expect(cost.toString(player)).toMatchInlineSnapshot(
      `"§61.000, §7Яблоко §r§f§7x1, §7Незеритовый топор §r§f§7x1, §7§a10§7lvl"`,
    )

    expect(cost.toString(player, false)).toMatchInlineSnapshot(
      `"§c1.000, §cЯблоко §r§f§cx1, §cНезеритовый топор §r§f§cx1, §4§c10§4lvl"`,
    )

    expect(cost.failed(player)).toMatchInlineSnapshot(`
      "§7§60§7/§61.000§7§f§7
      §c§70§c/§71§c §f§cЯблоко§c
      §c§70§c/§71§c §f§cНезеритовый топор§c
      §cНужно уровней опыта: §710§c, §70§c/§710§c
      "
    `)
  })

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

    const multicost = new MultiCost(new StringCost(), new NumberCost(), new NumberCost()).take(player)
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

    const multicost = new MultiCost(new StringCost(), new MultiCost(new NumberCost(), new NumberCost())).take(player)
    expectTypeOf(multicost[0]).toBeString()
    expectTypeOf(multicost[1][0]).toBeNumber()
    expectTypeOf(multicost[1][1]).toBeNumber()

    // @ts-expect-error
    expectTypeOf(multicost[4]).toBeString()
    // @ts-expect-error
    expectTypeOf(multicost[2]).toBeString()
  })
})
