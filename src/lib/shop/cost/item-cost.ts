import { ItemStack, Player } from '@minecraft/server'
import { MaybeRawText, t } from 'lib/text'
import { Cost } from '../cost'
import { itemDescription } from '../rewards'
import { CostType } from './cost'

export type ItemFilter = (itemStack: ItemStack) => boolean

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
      if (amount === 0) break
      if (!item || !this.is(item)) continue

      amount -= item.amount
      if (amount < 0) {
        // in this slot there is more items then we need
        slots.set(i, -(amount + item.amount))
        break
      } else {
        // take all the items from this slot
        slots.set(i, undefined)
      }
    }

    return { canBuy: amount <= 0, slots, amount }
  }

  has(player: Player) {
    return this.getItems(player).canBuy
  }

  take(player: Player): void {
    const items = this.getItems(player)

    const { container } = player
    if (!container) return
    for (const [i, amount] of items.slots) {
      if (amount) {
        container.getSlot(i).amount += amount
      } else {
        container.setItem(i, undefined)
      }
    }

    super.take(player)
  }

  toString(canBuy?: boolean, _?: Player, amount = true): MaybeRawText {
    return itemDescription(
      this.item instanceof ItemStack ? this.item : { typeId: this.item, amount: this.amount },
      canBuy ? '§7' : '§c',
      amount,
    )
  }

  failed(player: Player): MaybeRawText {
    super.failed(player)
    const items = this.getItems(player)

    return t.raw`${t.error`${this.amount - items.amount}/${this.amount} `}${this.toString(false, void 0, false)}`
  }
}

export class ShouldHaveItemCost extends ItemCost {
  get type() {
    return CostType.Requirement
  }

  static createFromFilter(filter: ItemFilter, text?: ShouldHaveItemCost['text']) {
    const cost = new this('', 1, filter)
    cost.text = text ?? ''
    return cost
  }

  private text: MaybeRawText = ''

  toString() {
    return this.text
  }

  failed(player: Player) {
    return this.text ? t.error`В инвентаре нет ${this.text}` : t.error`Нет предмета`
  }

  take(player: Player): void {
    return
  }
}
