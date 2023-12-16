import { ItemLockMode, ItemStack, Player, world } from '@minecraft/server'
import { createPublicGiveItemCommand } from 'modules/Survival/utils/createPublicGiveItemCommand.js'
import { ActionForm, MessageForm, util } from 'smapi.js'

class MenuBuilder {
  constructor() {
    this.item = new ItemStack('sm:menu').setInfo(
      '§b§lМеню\n§r(use)',
      '§r§7Для открытия возьми в руку и зажми на телефоне, пкм на пк\n\nЧтобы убрать из инвентаря напиши в чат: §f-menu'
    )

    this.item.lockMode = ItemLockMode.inventory

    createPublicGiveItemCommand('menu', this.item)

    world.afterEvents.itemUse.subscribe(async ({ source: player, itemStack }) => {
      if (itemStack.typeId !== this.item.typeId || !(player instanceof Player)) return

      util.catch(() => {
        const menu = this.open(player)
        if (menu) menu.show(player)
      })
    })
  }
  /**
   * Function that gets called when menu item is used
   * @param {import("@minecraft/server").Player} player
   * @returns {false | ActionForm}
   */
  open(player) {
    new MessageForm('Меню выключено', 'Все еще в разработке').show(player)

    return false
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Menu = new MenuBuilder()
