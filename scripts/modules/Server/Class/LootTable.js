import { Container, ItemStack, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { Enchantments } from './Enchantments.js'

new Command({
  name: 'loot',
  role: 'admin',
})
  .string('lootTableName', true)
  .executes((ctx, lootTableName) => {
    const lootTable = LootTable.instances[lootTableName]
    if (!lootTable)
      return ctx.error(
        lootTableName +
          ' - unknown. Valid:\n' +
          Object.keys(LootTable.instances).join('\n')
      )

    const block = ctx.sender.dimension.getBlock(ctx.sender.location)?.below()
    if (!block) return ctx.error('No block under feats')
    const inventory = block.getComponent('inventory')
    if (!inventory || !inventory.container)
      return ctx.error('No inventory in block')
    inventory.container.clearAll()
    lootTable.fillContainer(inventory.container)
  })

export class LootTable {
  /** @type {Record<string, LootTable>} */
  static instances = {}
  /**
   * Stored items
   * @type {Array<import("../server.js").LootItem.Stored>}
   */
  items

  totalChance = 0

  /**
   * @typedef {{ type: "itemsCount" } | { type: "airPercent", air: Percent }} LootTableFillType
   */

  /**
   * Creates new LootTable with specified items
   * @param {object} o
   * @param {string} o.key
   * @param {LootTableFillType} [o.fill]
   * @param  {...import("../server.js").LootItem.Input} items - Items to randomise
   */
  constructor({ key, fill = { type: 'airPercent', air: '50%' } }, ...items) {
    this.key = key
    this.fill = fill
    LootTable.instances[key] = this
    this.items = items.map(item => {
      /** @type {ItemStack} */
      let itemStack

      if ('itemStack' in item) {
        itemStack = item.itemStack
      } else {
        if ('type' in item) {
          itemStack = new ItemStack(MinecraftItemTypes[item.type])
        } else itemStack = new ItemStack(item.typeId)
      }

      /** @type {number[]} */
      const amount =
        typeof item.amount === 'number'
          ? [item.amount]
          : typeof item.amount === 'object'
          ? RandomCost.toArray(item.amount)
          : [1]

      const chance = parseInt(item.chance)
      if (isNaN(chance)) {
        throw new TypeError(
          `Chance must be \`{number}%\`, got '${chance}' instead!`
        )
      }

      if (chance !== 100) this.totalChance += chance

      if (item.options) {
        const { canDestroy, canPlaceOn, lockMode, keepOnDeath, lore, nameTag } =
          item.options
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
          })
        ),
        damage: item.damage ? RandomCost.toArray(item.damage) : [],
      }
    })
  }

  /**
   * Randomises items and returns array with specified size
   * @param {number} size - Size of the array
   * @returns {Array<ItemStack | void>}
   */
  generate(size) {
    let stepMax = 0
    if (this.fill.type === 'airPercent') {
      stepMax = ~~(size * (parseInt(this.fill.air) / 100))
    } else {
      size = Math.min(size, this.items.length - 1)
    }

    /** @type {NonNullable<ReturnType<this['generateItem']>>} */
    // @ts-expect-error Filter mistype
    const items = this.items.map(i => this.generateItem(i)).flat()

    let explictItems = items.filter(e => e.chance === 100)
    let randomizableItems = items.filter(e => !explictItems.includes(e))

    let air = 0
    return new Array(size).fill(null).map((_, i) => {
      // Select air between items
      if (air > 0) {
        air--
        return
      }
      air = Math.randomInt(
        0,
        stepMax - (explictItems.length + randomizableItems.length)
      )

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

  /**
   * @param {import('modules/Server/server.js').LootItem.Stored} item
   * @returns {{stack: ItemStack, chance: number}[]}
   */
  generateItem(item) {
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
          this.generateItem({
            ...e,
            amount: i === a.length - 1 ? last : average,
          })
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
  }

  /**
   * @param {Container} container
   */
  fillContainer(container) {
    for (const [i, item] of this.generate(container.size).entries()) {
      if (item) container.setItem(i, item)
    }
  }
}

const RandomCost = {
  /**
   * @param {RandomCostMapType} inputMap
   */
  toArray(inputMap) {
    /** @type {Record<number, number>} */
    const newMap = {}

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
          throw new RangeError(
            'Min cannot be equal to max. Use one number as key instead.'
          )
        }

        for (let i = min; i <= max; i++) {
          if (newMap[i]) {
            throw new RangeError(
              `Key '${i}' already exists and has value of ${newMap[i]}%. (Affected range: '${range}')`
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
    const finalMap = new Array(Object.values(newMap).reduce((p, c) => p + c, 0))

    let i = 0
    for (const [key, value] of Object.entries(newMap)) {
      finalMap.fill(Number(key), i, i + value)
      i += value
    }

    return finalMap
  },
}
