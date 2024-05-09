import { Container, ItemLockMode, ItemStack } from '@minecraft/server'
import { MinecraftEnchantmentTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Enchantments } from './enchantments'
import { EventSignal } from './event-signal'

declare namespace LootItem {
  type RandomCostMapType = {
    [key: `${number}...${number}` | number]: Percent
  }

  type Percent = `${number}%`
  interface Common {
    /**
     * - Amount of the item
     *
     * @default 1
     */
    amount?: RandomCostMapType | number
    /** - Cost of the item. Items with higher cost will be generated more often */
    chance: Percent

    /** - Map in format { enchant: { level: percent } } */
    enchantments?: Partial<Record<keyof typeof MinecraftEnchantmentTypes, RandomCostMapType>>
    /** - Damage of the item */
    damage?: RandomCostMapType

    /** - Additional options for the item like canPlaceOn, canDestroy, nameTag etc */
    options?: Options
  }

  interface Options {
    lore?: string[]
    nameTag?: string
    keepOnDeath?: boolean
    canPlaceOn?: string[]
    canDestroy?: string[]
    lockMode?: ItemLockMode
  }

  interface TypeIdInput {
    /** - Stringified id of the item. May include namespace (e.g. "minecraft:"). */
    typeId: string
  }

  interface TypeInput {
    /** - Item type name. Its key of MinecraftItemTypes. */
    type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'>
  }

  interface ItemStackInput {
    /** - Item stack. Will be cloned. */
    itemStack: ItemStack
  }

  type Input = (TypeIdInput | TypeInput | ItemStackInput) & Common

  type Stored = {
    itemStack: ItemStack
    enchantments: Record<string, number[]>
    chance: number
    amount: number[]
    damage: number[]
  }
}

new Command('loot')
  .setPermissions('curator')
  .string('lootTableName', true)
  .executes((ctx, lootTableName) => {
    const lootTable = LootTable.instances[lootTableName]
    if (!lootTable)
      return ctx.error(lootTableName + ' - unknown. Valid:\n' + Object.keys(LootTable.instances).join('\n'))

    const block = ctx.player.dimension.getBlock(ctx.player.location)?.below()
    if (!block) return ctx.error('No block under feats')
    const inventory = block.getComponent('inventory')
    if (!inventory || !inventory.container) return ctx.error('No inventory in block')
    inventory.container.clearAll()
    lootTable.fillContainer(inventory.container)
  })

type LootTableFillType = { type: 'itemsCount' } | { type: 'airPercent'; air: LootItem.Percent }

type LootItems = { stack: ItemStack; chance: number }[]

export class LootTable {
  static instances: Record<string, LootTable> = {}

  static onNew: EventSignal<LootTable> = new EventSignal()

  private fill

  public id

  /** Stored items */
  private items: LootItem.Stored[]

  private totalChance = 0

  /**
   * Creates new LootTable with specified items
   *
   * @param o
   * @param o.id
   * @param o.fill
   * @param items - Items to randomise
   */
  constructor(
    { id, fill = { type: 'airPercent', air: '50%' } }: { id: string; fill?: LootTableFillType },
    ...items: LootItem.Input[]
  ) {
    this.id = id
    this.fill = fill
    this.items = items.map(item => {
      let itemStack: ItemStack

      if ('itemStack' in item) {
        itemStack = item.itemStack
      } else {
        if ('type' in item) {
          itemStack = new ItemStack(MinecraftItemTypes[item.type])
        } else itemStack = new ItemStack(item.typeId)
      }

      /** @type {number[]} */
      const amount: number[] =
        typeof item.amount === 'number'
          ? [item.amount]
          : typeof item.amount === 'object'
            ? RandomCost.toArray(item.amount)
            : [1]

      const chance = parseInt(item.chance)
      if (isNaN(chance)) {
        throw new TypeError(`Chance must be \`{number}%\`, got '${chance}' instead!`)
      }

      if (chance !== 100) this.totalChance += chance

      if (item.options) {
        const { canDestroy, canPlaceOn, lockMode, keepOnDeath, lore, nameTag } = item.options
        if (canDestroy) itemStack.setCanDestroy(canDestroy)
        if (item.options.canPlaceOn) itemStack.setCanPlaceOn(canPlaceOn)
        if (lockMode) itemStack.lockMode = lockMode
        if (keepOnDeath) itemStack.keepOnDeath = true
        if (lore) itemStack.setLore(lore)
        if (nameTag) itemStack.nameTag = nameTag
      }

      return {
        itemStack,
        chance,
        amount,
        enchantments: Object.fromEntries(
          Object.entries(item.enchantments ?? {}).map(([key, value]) => {
            return [key, RandomCost.toArray(value)]
          }),
        ),
        damage: item.damage ? RandomCost.toArray(item.damage) : [],
      }
    })

    LootTable.instances[id] = this
    EventSignal.emit(LootTable.onNew, this)
  }

  /**
   * Randomises items and returns array with specified size
   *
   * @param {number} size - Size of the array
   * @returns {(ItemStack | void)[]}
   */
  generate(size: number = this.items.length - 1): (ItemStack | void)[] {
    let stepMax = 0
    if (this.fill.type === 'airPercent') {
      stepMax = ~~(size * (parseInt(this.fill.air) / 100))
    } else {
      size = Math.min(size, this.items.length - 1)
    }

    /** @type {NonNullable<LootItems>} */
    const items: NonNullable<LootItems> = this.items.map(i => this.generateItems(i)).flat()

    let explictItems = items.filter(e => e.chance === 100)
    let randomizableItems = items.filter(e => !explictItems.includes(e))

    let air = 0
    return new Array(size).fill(null).map((_, i) => {
      // Select air between items
      if (air > 0) {
        air--
        return
      }
      air = Math.randomInt(0, stepMax - (explictItems.length + randomizableItems.length))

      if (explictItems.length) {
        const item = explictItems.randomElement()
        explictItems = explictItems.filter(e => e !== item)
        return item.stack
      } else {
        // Get random item depends on chance
        let random = Math.randomInt(0, this.totalChance)
        const item = randomizableItems.find(e => {
          random -= e.chance
          return random < 0
        })

        if (!item) return

        randomizableItems = randomizableItems.filter(e => e !== item)

        return item.stack
      }
    })
  }

  private generateItems(item: LootItem.Stored): LootItems {
    try {
      // Randomise item properties
      const amount = item.amount.randomElement()
      if (amount <= 0) return []

      if (amount > item.itemStack.maxAmount) {
        // TODO Splitting
        const average = Math.floor(amount / item.itemStack.maxAmount)
        const last = amount % item.itemStack.maxAmount
        return new Array(average)
          .fill(null)
          .map((e, i, a) =>
            this.generateItems({
              ...e,
              amount: i === a.length - 1 ? last : average,
            }),
          )
          .flat()
      }

      const stack = item.itemStack.clone()
      stack.amount = amount

      const { enchantments } = stack.enchantments
      for (const [name, levels] of Object.entries(item.enchantments)) {
        const level = levels.randomElement()
        if (!level) continue

        enchantments.addEnchantment(Enchantments.custom[name][level])
      }
      stack.enchantments.enchantments = enchantments

      if (item.damage.length) {
        const damage = item.damage.randomElement()
        if (damage) stack.durability.damage = damage
      }

      return [
        {
          stack,
          chance: item.chance,
        },
      ]
    } catch (err) {
      console.error('Failed to generate loot item for', item, 'error:', err)
      return []
    }
  }

  /** @param {Container} container */
  fillContainer(container: Container) {
    for (const [i, item] of this.generate(container.size).entries()) {
      if (item) container.setItem(i, item)
    }
  }
}

const RandomCost = {
  toArray(inputMap: LootItem.RandomCostMapType) {
    const newMap: Record<number, number> = {}

    for (const [range, rawValue] of Object.entries(inputMap)) {
      const value = parseInt(rawValue.slice(0, -1))

      if (range.includes('.')) {
        // Extract `number...number`
        const match = range.match(/^(\d{1,4})\.\.\.(\d{1,4})$/)

        if (!match) {
          throw new RangeError(`Range '${range}' doesn't matches the pattern.`)
        }
        const [, min, max] = match.map(n => parseInt(n))

        if (min > max) throw new RangeError('Min cannot be greater than max')
        if (min === max) {
          throw new RangeError('Min cannot be equal to max. Use one number as key instead.')
        }

        for (let i = min; i <= max; i++) {
          if (newMap[i]) {
            throw new RangeError(
              `Key '${i}' already exists and has value of ${newMap[i]}%. (Affected range: '${range}')`,
            )
          }

          newMap[i] = value
        }
      } else {
        const key = parseInt(range)
        if (isNaN(key)) throw new TypeError(`Not a number! (${range})`)

        newMap[key] = value
      }
    }

    /** @type {number[]} */

    const finalMap: number[] = new Array(Object.values(newMap).reduce((p, c) => p + c, 0))

    let i = 0
    for (const [key, value] of Object.entries(newMap)) {
      finalMap.fill(Number(key), i, i + value)

      i += value
    }

    return finalMap
  },
}
