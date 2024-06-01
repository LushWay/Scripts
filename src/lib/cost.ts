import { ItemStack, Player, RawText } from '@minecraft/server'
import { SOUNDS } from 'lib/assets/config'
import { emoji } from 'lib/assets/emoji'
import { itemLocaleName } from './game-utils'
import { itemDescription } from './rewards'
import { MaybeRawText, t } from './text'
import { noBoolean } from './util'

export class Cost<T = unknown> {
  /** Returns string representation of cost */
  toString(canBuy = true, player?: Player): MaybeRawText {
    return ''
  }

  /**
   * If the player have this cost returns true, otherwise false
   *
   * @param {Player} player - Player to check on
   */
  has(player: Player): boolean {
    return false
  }

  /**
   * Removes this cost from player
   *
   * @param {Player} player - Buyer
   */
  buy(player: Player): T {
    player.playSound(SOUNDS.action)
    return undefined as T
  }

  /**
   * Returns fail info for player
   *
   * @param {Player} player - Player to play sound on
   */
  failed(player: Player): MaybeRawText {
    player.playSound(SOUNDS.fail)
    return ''
  }
}

export class MultiCost<T extends Cost[]> extends Cost {
  private costs: T

  constructor(...costs: T) {
    super()
    this.costs = costs
  }

  toString(canBuy = true, player?: Player): RawText {
    return {
      rawtext: this.costs
        .map((cost, i, arr) => {
          const string = cost.toString(!canBuy && player ? cost.has(player) : canBuy, player)
          if (string === '') return false

          if (arr.length - 1 === i) return t.raw`${string}`
          else return t.raw`${string}, `
        })
        .filter(noBoolean),
    }
  }

  has(player: Player): boolean {
    return this.costs.every(e => e.has(player))
  }

  buy(player: Player) {
    super.buy(player)
    return this.costs.map(e => e.buy(player)) as {
      -readonly [P in keyof T]: T[P] extends Cost<infer R> ? R : never
    }
  }

  failed(player: Player): MaybeRawText {
    super.failed(player)
    let messages: RawText | undefined
    for (const cost of this.costs) {
      const canBuy = cost.has(player)
      if (!canBuy) {
        const failed = cost.failed(player)
        if (failed === '') continue

        if (messages) {
          messages = t.raw`${messages}\n${failed}`
        } else messages = t.raw`${failed}`
      }
    }

    return messages ?? t.raw`Недостаточно средств.`
  }

  item = this.createCostAlias(ItemCost)

  money = this.createCostAlias(MoneyCost)

  leafy = this.createCostAlias(LeafyCost)

  private createCostAlias<T extends typeof Cost | typeof ItemCost | typeof ScoreboardCost>(target: T) {
    return (...args: ConstructorParameters<T>) => {
      this.costs.push(
        // @ts-expect-error Idk why it complains
        new target(...args),
      )
      return this
    }
  }
}

class ScoreboardCost extends Cost {
  cost

  constructor(cost = 1) {
    super()
    if (cost < 0) throw new TypeError(`Invalid ScoreboardCost: ${cost} < 0, positive number expected`)
    this.cost = cost
  }

  scoreboard: import('@minecraft/server').ScoreName = 'money'

  emoji = 'N'

  color = '§7'

  toString(canBuy = true) {
    return `${canBuy ? this.color : '§c'}${this.cost}${this.emoji}`
  }

  has(player: Player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  buy(player: Player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  failed(player: Player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return t.error`${have}/${this.cost}${this.emoji}`
  }
}

export class MoneyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'money'

  emoji = emoji.money

  color = '§6'
}

export class LeafyCost extends ScoreboardCost {
  scoreboard: import('@minecraft/server').ScoreName = 'leafs'

  emoji = emoji.leaf

  color = '§a'
}

export class ItemCost extends Cost {
  /**
   * Creates new cost that checks for ItemStack in player inventory by checking their typeIds. For items with
   * enchantemts and other custom properties use ItemStack
   *
   * @param item - Type id or ItemStack to search for.
   * @param amount - Amount of items to search for.
   */
  constructor(
    private readonly item: string | ItemStack,
    private readonly amount = item instanceof ItemStack ? item.amount : 1,
    protected is = (itemStack: ItemStack) => {
      if (typeof this.item === 'string') return itemStack.typeId === this.item
      return this.item.is(itemStack)
    },
  ) {
    super()
  }

  protected getItems(player: Player) {
    if (!player.container) return { canBuy: false, slots: new Map<number, number | undefined>(), amount: 0 }

    let amount = this.amount
    const slots = new Map<number, number | undefined>()
    for (const [i, item] of player.container.entries()) {
      if (!item) continue
      if (this.is(item)) {
        amount -= item.amount
        if (amount < 0) {
          // in this slot there is more items then we need
          slots.set(i, -amount)
          continue
        } else {
          // take all the items from this slot
          slots.set(i, undefined)
        }
      }
    }

    return { canBuy: amount <= 0, slots, amount }
  }

  has(player: Player) {
    return this.getItems(player).canBuy
  }

  buy(player: Player): void {
    const items = this.getItems(player)

    const { container } = player
    if (!container) return
    for (const [i, amount] of items.slots) {
      if (amount) {
        container.getSlot(i).amount = amount
      } else {
        container.setItem(i, undefined)
      }
    }
  }

  toString(canBuy?: boolean): MaybeRawText {
    return itemDescription(
      this.item instanceof ItemStack ? this.item : { typeId: this.item, amount: this.amount },
      canBuy ? '§7' : '§c',
    )
  }

  failed(player: Player): MaybeRawText {
    const items = this.getItems(player)

    return t.raw`${t.error`${this.amount - items.amount}/${this.amount} `}${{ translate: itemLocaleName(this.item instanceof ItemStack ? this.item : { typeId: this.item }) }}`
  }
}

export class ShouldHaveItemCost extends ItemCost {
  buy(player: Player): void {
    return
  }

  toString() {
    return ''
  }

  failed(player: Player) {
    return t.error`Нет предмета`
  }
}
