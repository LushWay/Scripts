import { ItemLockMode, ItemStack, Player, world } from '@minecraft/server'
import { ActionForm, MessageForm, util } from 'smapi.js'

const item = new ItemStack('sm:menu')
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

world.afterEvents.itemUse.subscribe(async ({ source: player, itemStack }) => {
  if (itemStack.typeId !== MENU.item.typeId || !(player instanceof Player))
    return

  util.catch(() => {
    const menu = MENU.OnOpen(player)
    if (menu === false) return
    menu.show(player)
  })
})

new Command({
  name: 'menu',
  description: 'Выдает или убирает меню из инвентаря',
  type: 'public',
}).executes(async ctx => {
  const item = ctx.sender.runCommand(
    `testfor @s[hasitem={item=${MENU.item.typeId}}]`
  ).successCount
  if (item) {
    ctx.sender.runCommand(`clear @s ${MENU.item.typeId}`)
    ctx.reply('§c- §3Меню')
  } else {
    ctx.sender.getComponent('inventory').container.addItem(MENU.item)
    ctx.reply('§a+ §3Меню')
  }
})
