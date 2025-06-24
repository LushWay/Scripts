import { ItemStack, Player } from '@minecraft/server'
import { t } from 'lib/i18n/text'
import { ErrorCost } from './cost/cost'

export const ImpossibleBuyCost = ErrorCost(t.error`Покупка невозможна`)
export const ImpossibleSellCost = ErrorCost(t.error`Продажа невозможна`)
export const InventoryFull = (amount: number) => ErrorCost(t.error`Нет места в инвентаре (нужно еще ${amount})`)

export function getFreeSpaceForItemInInventory(player: Player, item: ItemStack) {
  if (!player.container) return 0

  let space = 0

  for (const [, slot] of player.container.slotEntries()) {
    if (!slot.typeId) space += item.maxAmount
    else if (slot.isStackableWith(item)) space += slot.maxAmount - slot.amount
  }

  return space
}
