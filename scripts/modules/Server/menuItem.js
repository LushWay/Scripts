import { ItemLockMode, ItemStack, Player, world } from '@minecraft/server'
import { createPublicGiveItemCommand } from 'modules/Gameplay/Survival/createPublicGiveItemCommand.js'
import { ActionForm, MessageForm, util } from 'smapi.js'

const item = new ItemStack('sm:menu').setInfo(
  '§b§lМеню\n§r(use)',
  '§r§7Для открытия возьми в руку и зажми на телефоне, пкм на пк\n\nЧтобы убрать из инвентаря напиши в чат: §f-menu'
)
item.lockMode = ItemLockMode.inventory

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

createPublicGiveItemCommand('menu', MENU.item)

world.afterEvents.itemUse.subscribe(async ({ source: player, itemStack }) => {
  if (itemStack.typeId !== MENU.item.typeId || !(player instanceof Player))
    return

  util.catch(() => {
    const menu = MENU.OnOpen(player)
    if (menu === false) return
    menu.show(player)
  })
})
