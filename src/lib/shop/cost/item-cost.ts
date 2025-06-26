import { ContainerSlot, EntityComponentTypes, EquipmentSlot, ItemStack, Player } from '@minecraft/server'
import { eqSlots } from 'lib/form/select-item'
import { Message } from 'lib/i18n/message'
import { i18n, noI18n } from 'lib/i18n/text'
import { itemNameXCount } from '../../utils/item-name-x-count'
import { Cost } from '../cost'
import { CostType } from './cost'

export type ItemFilter = (itemStack: ItemStack) => boolean

type Slots = Map<number | EquipmentSlot, { amount: number | undefined; slot: ContainerSlot }>

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
    const equippable = player.getComponent(EntityComponentTypes.Equippable)
    if (!player.container || !equippable) return { canBuy: false, slots: new Map() as Slots, amount: 0 }

    let amount = this.amount
    const slots = new Map() as Slots
    for (const [i, slot] of [
      ...player.container.slotEntries(),
      ...eqSlots.map(e => [e, equippable.getEquipmentSlot(e)] as const),
    ]) {
      if (amount === 0) break
      const item = slot.getItem()
      if (!item || !this.is(item)) continue

      amount -= item.amount
      if (amount < 0) {
        // in this slot there is more items then we need
        slots.set(i, { amount: -(amount + item.amount), slot })
        break
      } else {
        // take all the items from this slot
        slots.set(i, { amount: undefined, slot })
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
    for (const [, { amount, slot }] of items.slots) {
      if (amount) {
        slot.amount += amount
      } else {
        slot.setItem(undefined)
      }
    }

    super.take(player)
  }

  toString(player: Player, canBuy?: boolean, amount = true): string {
    return itemNameXCount(
      this.item instanceof ItemStack ? this.item : { typeId: this.item, amount: this.amount },
      canBuy ? '§7' : '§c',
      amount,
      player.lang,
    )
  }

  failed(player: Player): string {
    super.failed(player)
    const items = this.getItems(player)

    return noI18n.error`${this.amount - items.amount}/${this.amount} ${this.toString(player, false, false)}`
  }
}

export class ShouldHaveItemCost extends ItemCost {
  get type() {
    return CostType.Requirement
  }

  static createFromFilter(filter: ItemFilter, text?: Text) {
    const cost = new this('', 1, filter)
    cost.text = text ?? ''
    return cost
  }

  private text: Text = ''

  toString(player: Player) {
    return Message.translate(player.lang, this.text)
  }

  failed(player: Player) {
    // TODO Fix colors
    const message = this.text ? i18n.error`В инвентаре нет ${this.text}` : i18n.error`Нет предмета`
    return Message.translate(player.lang, message)
  }

  take(player: Player): void {
    return
  }
}
