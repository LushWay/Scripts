import { Container, EnchantmentType, ItemLockMode, ItemStack, system } from '@minecraft/server'
import { MinecraftEnchantmentTypes, MinecraftItemTypes, MinecraftItemTypesUnion } from '@minecraft/vanilla-data'
import { Command } from 'lib/command'
import { EventSignal } from 'lib/event-signal'
import { inspect, isKeyof } from 'lib/util'

type RandomCostMap = Record<`${number}...${number}` | number, Percent>
type Percent = `${number}%`

interface Options {
  lore?: string[]
  nameTag?: string
  keepOnDeath?: boolean
  canPlaceOn?: string[]
  canDestroy?: string[]
  lockMode?: ItemLockMode
}

interface StoredItem {
  itemStack: ItemStack
  enchantments: Partial<Record<MinecraftEnchantmentTypes, number[]>>
  chance: number
  amount: number[]
  damage: number[]
}

new Command('loot')
  .setPermissions('curator')
  .string('lootTableName')
  .executes((ctx, lootTableName) => {
    const lootTable = LootTable.instances.get(lootTableName)
    if (typeof lootTable === 'undefined')
      return ctx.error(
        `${lootTableName} - unknown loot table. All tables:\n${Object.keys(LootTable.instances).join('\n')}`,
      )

    const block = ctx.player.dimension.getBlock(ctx.player.location)?.below()
    if (!block) return ctx.error('No block under feats')
    const inventory = block.getComponent('inventory')
    if (!inventory?.container) return ctx.error('No inventory in block')
    lootTable.fillContainer(inventory.container)
  })

type PreparedItems = { item: ItemStack; chance: number }[]

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
  item(type: MinecraftItemTypesUnion): this

  /**
   * Creates new item entry from string type id
   *
   * @param type String type id
   */
  item(type: string) {
    if (isKeyof(type, MinecraftItemTypes)) type = MinecraftItemTypes[type]
    this.create(new ItemStack(type))

    return this
  }

  itemStack(item: ItemStack) {
    this.create(item)

    return this
  }

  private create(itemStack: ItemStack) {
    if (this.current) this.items.push(this.current)
    this.current = { itemStack, chance: 100, amount: [1], damage: [0], enchantments: {} }
  }

  private modifyCreatingItem() {
    if (!this.current) throw new Error('You should create item first! Use .item or .itemStack')
    return this.current
  }

  chance(percent: Percent) {
    const chance = parseInt(percent)
    if (isNaN(chance)) throw new TypeError(`Chance must be \`{number}%\`, got '${inspect(percent)}' instead!`)

    this.modifyCreatingItem().chance = chance

    return this
  }

  meta(meta: Options) {
    const { itemStack } = this.modifyCreatingItem()
    const { canDestroy, canPlaceOn, lockMode, keepOnDeath, lore, nameTag } = meta
    if (canDestroy) itemStack.setCanDestroy(canDestroy)
    if (canPlaceOn) itemStack.setCanPlaceOn(canPlaceOn)
    if (lockMode) itemStack.lockMode = lockMode
    if (keepOnDeath) itemStack.keepOnDeath = true
    if (lore) itemStack.setLore(lore)
    if (nameTag) itemStack.nameTag = nameTag

    return this
  }

  enchantmetns(enchantments: Partial<Record<MinecraftEnchantmentTypes, RandomCostMap>>) {
    this.modifyCreatingItem().enchantments = Object.map(enchantments, (key, value) => [
      key,
      Loot.randomCostToArray(value),
    ])

    return this
  }

  amount(amount: RandomCostMap) {
    this.modifyCreatingItem().amount = Loot.randomCostToArray(amount)

    return this
  }

  damage(damage: RandomCostMap) {
    this.modifyCreatingItem().damage = Loot.randomCostToArray(damage)

    return this
  }

  static randomCostToArray(input: RandomCostMap) {
    const parsed: Record<number, number> = {}

    for (const [range, rawValue] of Object.entries(input)) {
      const value = parseIntStrict(rawValue)

      if (range.includes('.')) {
        const match = /^(\d{1,4})\.\.\.(\d{1,4})$/.exec(range)
        if (!match) throw new RangeError(`Range '${range}' doesn't matches the pattern 'number...number'.`)

        const [, min, max] = match.map(parseIntStrict)
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

    const size = Object.values(parsed).reduce((p, c) => p + c, 0)
    const array = new Array<number>(size)

    let i = 0
    for (const [key, value] of Object.entries(parsed)) {
      array.fill(Number(key), i, i + value)
      i += value
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
  static instances = new Map<string, LootTable>()

  static onNew = new EventSignal<LootTable>()

  constructor(
    private items: StoredItem[],
    public id?: string,
  ) {
    if (id) {
      const created = LootTable.instances.get(id)
      if (created) return created

      LootTable.instances.set(id, this)
      EventSignal.emit(LootTable.onNew, this)
    }
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
    const items = this.items.map(i => this.generateItems(i)).flat()
    if (length === 1) return items.map(e => e.item)

    // Separate items by chance
    let explictItems = items.filter(e => e.chance === 100)
    const randomizableItems = items.filter(e => e.chance !== 100)

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
        randomizableItems.splice(index, 1)

        return item
      }
    })
  }

  private generateItems(item: StoredItem): PreparedItems {
    try {
      // Randomise item properties
      const amount = item.amount.randomElement()
      if (amount <= 0) return []
      if (amount > item.itemStack.maxAmount) {
        const average = Math.floor(amount / item.itemStack.maxAmount)
        const last = amount % item.itemStack.maxAmount
        return new Array(average)
          .fill(null)
          .map((e, i, a) =>
            this.generateItems({
              ...item,
              amount: e === a.at(-1) ? [last] : [average],
            }),
          )
          .flat()
      }

      const stack = item.itemStack.clone()
      stack.amount = amount

      const { enchantable } = stack
      if (enchantable) {
        for (const [type, levels] of Object.entriesStringKeys(item.enchantments)) {
          if (!levels) continue

          const level = levels.randomElement()
          if (!level) continue

          enchantable.addEnchantment({ type: new EnchantmentType(type), level })
        }
      }

      if (item.damage.length) {
        const damage = item.damage.randomElement()
        if (damage && stack.durability) stack.durability.damage = damage
      }

      return [
        {
          item: stack,
          chance: item.chance,
        },
      ]
    } catch (err) {
      console.error('Failed to generate loot item for', item, 'error:', err)
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

export function selectByChance<T>(items: { chance: number; item: T }[]) {
  const totalChance = items.reduce((sum, { chance }) => sum + chance, 0)
  let random = Math.randomFloat(0, totalChance)

  for (const [index, { chance, item }] of items.entries()) {
    random -= chance
    if (random < 0) return { index, item }
  }

  return { index: 0, item: items[0].item }
}
