import { ItemStack, Player } from '@minecraft/server'
import { SOUNDS } from 'lib/assets/config'
import { emoji } from 'lib/assets/emoji'

export class Cost {
  /** Returns string representation of cost */
  toString(canBuy = true): string {
    return ''
  }

  /**
   * If the player have this cost returns true, otherwise false
   *
   * @param {Player} player - Player to check on
   */
  check(player: Player): boolean {
    return false
  }

  /**
   * Removes this cost from player
   *
   * @param {Player} player - Buyer
   */
  buy(player: Player) {
    player.playSound(SOUNDS.action)
  }

  /**
   * Returns fail info for player
   *
   * @param {Player} player - Player to play sound on
   */
  failed(player: Player): string {
    player.playSound(SOUNDS.fail)
    return 'Недостаточно средств'
  }
}

export class MultiCost extends Cost {
  private costs: Cost[]

  constructor(...costs: Cost[]) {
    super()
    this.costs = costs
  }

  toString(canBuy = true): string {
    return this.costs.map(e => e.toString(canBuy)).join(' ')
  }

  check(player: Player): boolean {
    return this.costs.every(e => e.check(player))
  }

  buy(player: Player): void {
    this.costs.forEach(e => e.buy(player))
  }

  failed(player: Player): string {
    for (const cost of this.costs) {
      const canBuy = cost.check(player)
      if (!canBuy) return cost.failed(player)
    }

    return super.failed(player)
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

  check(player: Player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  buy(player: Player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  failed(player: Player) {
    super.failed(player)
    const have = player.scores[this.scoreboard]
    return `§cНедостаточно средств (§4${have}/${this.cost}§c). Нужно еще ${this.color}${this.cost - have}`
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
   * enchantemts and other custom properties use {@link ItemStackCost}
   *
   * @param typeId - Type id to search for.
   * @param amount - Amount of items to search for.
   */
  constructor(
    private readonly typeId: string,
    private readonly amount = 1,
  ) {
    super()
  }

  protected is(itemStack: ItemStack): boolean {
    return itemStack.typeId === this.typeId
  }

  protected getItems(player: Player) {
    if (!player.container) return { canBuy: false, slots: new Map<number, number | undefined>() }

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

    return { canBuy: amount <= 0, slots }
  }

  check(player: Player) {
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
}

export class ItemStackCost extends ItemCost {
  /**
   * Creates new cost that checks for ItemStack in player inventory. Usefull for items with enchantemts and other custom
   * properties.
   *
   * @param itemStack - {@link ItemStack} to check
   * @param amount - Amount of items. Defaults to {@link ItemStack.amount}. Usefull when cost requires amount that is
   *   greater then max item stack allowed amount
   */
  constructor(
    private readonly itemStack: ItemStack,
    amount?: number,
  ) {
    super(itemStack.typeId, amount ?? itemStack.amount)
  }

  protected override is(itemStack: ItemStack): boolean {
    return itemStack.is(this.itemStack)
  }
}
