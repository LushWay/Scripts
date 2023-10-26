import { ItemLockMode, ItemStack } from '@minecraft/server'
import { ActionForm, MessageForm } from 'xapi.js'

const item = new ItemStack('xa:menu')
item.lockMode = ItemLockMode.inventory
item.setLore([
  '§r§7Для открытия возьми в руку и',
  '§r§7зажми на телефоне, пкм на пк',
  '',
  '§r§7Чтобы убрать из инвентаря',
  '§r§7напиши в чат: §f-menu',
])

export const MENU = {
  item,
  /**
   *
   * @param {import("@minecraft/server").Player} player
   * @returns {false | ActionForm}
   */
  OnOpen(player) {
    new MessageForm('Меню выключено', 'Все еще в разработке').show(player)

    return false
  },
}
