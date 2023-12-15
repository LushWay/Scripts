import { Container, ItemStack, ItemTypes, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data.js'
import { Enchantments } from './Enchantments.js'

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
   * Creates new LootTable with specified items
   * @param {object} o
   * @param {string} o.key
   * @param  {...import("../server.js").LootItem.Input} items - Items to randomise
   */
  constructor({ key }, ...items) {
    this.key = key
    LootTable.instances[key] = this
    this.items = items.map(item => {
      const id =
        'type' in item
          ? MinecraftItemTypes[item.type]
          : ItemTypes.get(item.id)?.id

      if (!id)
        throw new TypeError(
          'Unkown LootTable.item id: ' + ('type' in item ? item.type : item.id)
        )

      /** @type {number[]} */
      const amount =
        typeof item.amount === 'number'
          ? [item.amount]
          : typeof item.amount === 'object'
          ? RandomCost.toArray(item.amount)
          : [1]

      /** @type {Record<string, number[]>} */
      const enchantments = {}
      for (const [key, value] of Object.entries(item.enchantments ?? {})) {
        enchantments[key] = RandomCost.toArray(value)
      }

      const chance = parseInt(item.chance)
      if (isNaN(chance))
        throw new TypeError(
          `Chance must be \`{number}%\`, got '${chance}' instead!`
        )
      this.totalChance += chance

      /** @type {import("../server.js").LootItem.Options<number[]>} */
      const options = Object.assign(item?.options ?? {})
      if (item.options?.damage) {
        options.damage = RandomCost.toArray(item.options.damage)
      }

      return {
        id: id,
        chance: chance,
        nameTag: item.nameTag ?? '',
        lore: item.lore ?? [],
        enchantments: enchantments,
        amount: amount,
        options: options ?? {},
      }
    })
  }

  /**
   * Randomises items and returns array with specified size
   * @param {number} size - Size of the array
   * @param {Percent} air
   * @returns {Array<ItemStack | null | undefined>}
   */
  generate(size, air = '70%') {
    let step = 0
    const stepMax = ~~(size * (parseInt(air) / 100))
    world.debug({ stepMax })

    return new Array(size).fill(null).map(() => {
      // Select air between items
      if (step > 0) {
        step--
        return null
      }

      step = Math.randomInt(0, stepMax)

      // Get random item depends on chance
      let random = Math.randomInt(0, this.totalChance)
      /**
       * @type {import("../server.js").LootItem.Stored}
       */
      let item

      for (const current of this.items) {
        random -= current.chance

        if (0 > random) {
          item = current
          break
        }
      }

      item = this.items[0]

      // Randomise item properties
      const amount = item.amount.randomElement()
      if (amount <= 0) return

      const stack = new ItemStack(item.id, amount)

      const { enchantments } = stack.enchantments
      for (const [name, levels] of Object.entries(item.enchantments)) {
        const level = levels.randomElement()
        if (!level) continue
        enchantments.addEnchantment(Enchantments.custom[name][level])
      }
      stack.enchantments.enchantments = enchantments

      const {
        canDestroy,
        canPlaceOn,
        damage: durability,
        lockMode,
        keepOnDeath,
      } = item.options

      if (item.nameTag) stack.nameTag = item.nameTag
      if (item.lore.length) stack.setLore(item.lore)

      if (keepOnDeath) stack.keepOnDeath = true
      if (lockMode) stack.lockMode = lockMode
      if (canDestroy?.length) stack.setCanDestroy(canDestroy)
      if (canPlaceOn?.length) stack.setCanPlaceOn(canPlaceOn)
      if (durability?.length) {
        const damage = durability.randomElement()
        if (damage) stack.durability.damage = damage
      }

      return stack
    })
  }

  /**
   * @param {Container} container
   * @param {Percent} [air]
   */
  fillContainer(container, air) {
    for (const [i, item] of this.generate(container.size, air).entries()) {
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
