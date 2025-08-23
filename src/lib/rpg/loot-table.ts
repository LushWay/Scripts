import { Container, EnchantmentType, ItemLockMode, ItemStack, system } from '@minecraft/server'
import { MinecraftEnchantmentTypes, MinecraftEnchantmentTypesUnion, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { Enchantments } from 'lib/enchantments'
import { EventSignal } from 'lib/event-signal'
import { inspect, isKeyof, pick } from 'lib/util'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { selectByChance } from './random'

type RandomCostMap = Record<`${number}...${number}` | number, Percent>
type Percent = `${number}%`

interface ItemStackMetaOptions {
  lore?: string[]
  nameTag?: string
  keepOnDeath?: boolean
  canPlaceOn?: string[]
  canDestroy?: string[]
  lockMode?: ItemLockMode
}

interface StoredItem {
  itemStack: ItemStack | (() => ItemStack)
  enchantments: Partial<Record<MinecraftEnchantmentTypes, number[]>>
  weight: number
  amount: number[]
  damage: number[]
  custom: { chances: number[]; apply: (item: ItemStack, result: number) => void }[]
}

type PreparedItems = { item: ItemStack; weight: number }[]

export class Loot {
  private items: StoredItem[] = []

  /** Item being created */
  private current?: StoredItem

  /**
   * Creates new LootTable with specified items
   *
   * @param o
   * @param o.id
   * @param o.fill
   * @param items - Items to randomise
   */
  constructor(private id?: string) {
    system.delay(() => this.build)
  }

  /**
   * Creates new item entry from MinecraftItemTypes
   *
   * @param type Keyof MinecraftItemTypes
   */
  item(type: Exclude<keyof typeof MinecraftItemTypes, 'prototype' | 'string'> | Items) {
    this.create(new ItemStack(isKeyof(type, MinecraftItemTypes) ? MinecraftItemTypes[type] : type))

    return this
  }

  itemStack(item: ItemStack | (() => ItemStack)) {
    this.create(item)

    return this
  }

  private create(itemStack: ItemStack | (() => ItemStack)) {
    if (this.current) this.items.push(this.current)
    this.current = { itemStack, weight: 100, amount: [1], damage: [0], enchantments: {}, custom: [] }
  }

  private getCurrent() {
    if (!this.current) throw new Error('You should create item first! Use .item or .itemStack')
    return this.current
  }

  weight(percent: Percent) {
    const weight = parseInt(percent)
    if (isNaN(weight)) throw new TypeError(`Chance must be \`{number}%\`, got '${inspect(percent)}' instead!`)

    this.getCurrent().weight = weight

    return this
  }

  meta(meta: ItemStackMetaOptions) {
    const { itemStack } = this.getCurrent()
    if (typeof itemStack === 'function') {
      this.getCurrent().itemStack = () => {
        const item = itemStack()
        applyOptions(item, meta)
        return item
      }
    } else {
      applyOptions(itemStack, meta)
    }

    return this
  }

  enchantmetns(enchantments: Partial<Record<MinecraftEnchantmentTypesUnion, RandomCostMap>>) {
    this.getCurrent().enchantments = Object.map(enchantments, (key, value) => [
      MinecraftEnchantmentTypes[key],
      Loot.randomCostToArray(value),
    ])

    return this
  }

  amount(amount: RandomCostMap) {
    this.getCurrent().amount = Loot.randomCostToArray(amount)

    return this
  }

  damage(damage: RandomCostMap) {
    this.getCurrent().damage = Loot.randomCostToArray(damage)

    return this
  }

  custom(chances: RandomCostMap, apply: (item: ItemStack, result: number) => void) {
    this.getCurrent().custom.push({ chances: Loot.randomCostToArray(chances), apply })
  }

  duplicate(count: number) {
    // We should push it count-1 times because next thing also pushes it
    for (let i = 0; i < count - 1; i++) this.items.push(this.getCurrent())

    return this
  }

  trash(types: Partial<Record<'web' | 'string', number>>) {
    if (typeof types.string === 'number')
      this.item('String').weight('30%').amount({ '5...10': '1%' }).duplicate(types.string)

    if (typeof types.web === 'number') this.item('Web').weight('40%').amount({ '1...2': '1%' }).duplicate(types.web)

    return this
  }

  static randomCostToArray(input: RandomCostMap) {
    const parsed: Record<number, number> = {}

    for (const [range, rawValue] of Object.entries(input)) {
      const value = parseIntStrict(rawValue)

      if (range.includes('.')) {
        const match = /^(\d{1,4})\.\.\.(\d{1,4})$/.exec(range)
        if (!match) throw new RangeError(`Range '${range}' doesn't matches the pattern 'number...number'.`)

        const [, min, max] = match.map(parseIntStrict) as [string, number, number]
        if (min > max) throw new RangeError('Min cannot be greater than max.')
        if (min === max) throw new RangeError('Min cannot be equal to max. Use one number as key instead.')

        for (let i = min; i <= max; i++) {
          if (parsed[i])
            throw new RangeError(
              `Key '${i}' already exists and has value of ${parsed[i]}%. (Affected range: '${range}')`,
            )
          parsed[i] = value
        }
      } else {
        parsed[parseIntStrict(range)] = value
      }
    }

    const min = Math.min(...Object.values(parsed))
    let array: number[] = []

    for (const [key, value] of Object.entries(parsed)) {
      const toFill = Math.round(value / min)
      array = array.concat(new Array(toFill).fill(Number(key), 0, toFill))
    }

    return array
  }

  get build() {
    if (this.current) {
      this.items.push(this.current)
      delete this.current
    }

    return new LootTable(this.items, this.id)
  }
}

export class LootTable {
  static all: LootTable[] = []

  static instances = new Map<string, LootTable>()

  static onNew = new EventSignal<LootTable>()

  constructor(
    readonly items: StoredItem[],
    public id?: string,
  ) {
    if (id) {
      const created = LootTable.instances.get(id)
      if (created) return created

      LootTable.instances.set(id, this)
      EventSignal.emit(LootTable.onNew, this)
    }

    LootTable.all.push(this)
  }

  generateOne() {
    const items = this.items.map(i => this.generateItems(i)).flat()
    return selectByChance(items).item
  }

  /**
   * Randomizes items and returns an array with specified size
   *
   * @param length - Size of the array
   * @returns Array of ItemStack or undefined
   */
  generate(length = this.items.length): (ItemStack | undefined)[] {
    const items = this.items.map(i => this.generateItems(i)).flat() as {
      item: undefined | ItemStack
      weight: number
    }[]
    if (length === 1) return items.map(e => e.item)

    // Separate items by chance
    let explictItems = items.filter(e => e.weight === 100)
    const randomizableItems = items.filter(e => e.weight !== 100)

    let air = 0

    let i = length
    return Array.from({ length }, () => {
      i--
      if (air > 0) return air--, undefined

      air = Math.randomInt(0, i - (explictItems.length + randomizableItems.length))

      if (explictItems.length > 0) {
        const item = explictItems.randomElement() // Remove and get item
        explictItems = explictItems.filter(e => e !== item)
        return item.item
      } else if (randomizableItems.length > 0) {
        const { index, item } = selectByChance(randomizableItems)
        if (randomizableItems[index]) randomizableItems[index].item = undefined

        return item
      }
    })
  }

  private generateItems(item: StoredItem): PreparedItems {
    try {
      // Randomise item properties
      const amount = item.amount.randomElement()
      if (amount <= 0) return []

      let stack = typeof item.itemStack === 'function' ? item.itemStack().clone() : item.itemStack.clone()
      const { maxAmount } = stack
      if (amount > maxAmount) {
        const average = Math.floor(amount / maxAmount)
        const last = amount % maxAmount
        return new Array(average)
          .fill(null)
          .map((_, i, a) => this.generateItems({ ...item, amount: i + 1 === a.length ? [last] : [average] }))
          .flat()
      }

      stack.amount = amount

      const { enchantable } = stack
      if (enchantable) {
        for (const [type, levels] of Object.entriesStringKeys(item.enchantments)) {
          if (!levels) continue

          const level = levels.randomElement()
          if (!level) continue

          const etype = new EnchantmentType(type)

          if (level <= etype.maxLevel) {
            enchantable.addEnchantment({ type: etype, level })
          } else {
            const custom = Enchantments.custom[type]?.[level]?.[stack.typeId]
            if (!custom) throw new Error(`Unkown enchantment for ${stack.typeId}: ${type} ${level}`)

            const newitem = custom.clone()
            copyAllItemPropertiesExceptEnchants(stack, newitem)
            newitem.enchantable?.addEnchantments(enchantable.getEnchantments())
            stack = newitem
          }
        }
      }

      if (item.damage.length) {
        const damage = item.damage.randomElement()
        if (damage && stack.durability) stack.durability.damage = damage
      }

      for (const custom of item.custom) custom.apply(stack, custom.chances.randomElement())

      return [{ item: stack, weight: item.weight }]
    } catch (err) {
      console.error(
        'Failed to generate loot item for',
        this.id,
        pick(item, ['amount', 'weight', 'damage', 'enchantments']),
        'error:',
        err,
      )
      return []
    }
  }

  fillContainer(container: Container) {
    container.clearAll()
    for (const [i, item] of this.generate(container.size).shuffle().entries()) {
      if (item) container.setItem(i, item)
    }
  }
}

function parseIntStrict(string: string) {
  const int = parseInt(string)
  if (isNaN(int)) throw new TypeError(`Expected number, got ${inspect(string)}`)

  return int
}

function applyOptions(itemStack: ItemStack, meta: ItemStackMetaOptions) {
  const { canDestroy, canPlaceOn, lockMode, keepOnDeath, lore, nameTag } = meta
  if (canDestroy) itemStack.setCanDestroy(canDestroy)
  if (canPlaceOn) itemStack.setCanPlaceOn(canPlaceOn)
  if (lockMode) itemStack.lockMode = lockMode
  if (keepOnDeath) itemStack.keepOnDeath = true
  if (lore) itemStack.setLore(lore)
  if (nameTag) itemStack.nameTag = nameTag
}
