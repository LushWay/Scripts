import { ActionForm } from 'lib.js'
import { Menu } from 'lib/Menu.js'
import { openBaseMenu } from 'modules/Features/baseMenu.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { questsMenu } from 'modules/Quests/command.js'
import { Anarchy } from '../Places/Anarchy.js'
import { Spawn } from '../Places/Spawn.js'

/**
 * @param {InventoryTypeName} place
 * @param {InventoryTypeName} inv
 */
function tp(place, inv, color = '§9', text = 'Спавн', extra = '') {
  const here = inv === place
  return `${here ? '§7Вы тут ' : color}> ${inv === place ? '§8' : '§f'}${text} ${here ? '§7' : color}<${extra}`
}

Menu.open = player => {
  const inv = player.database.inv
  const soon = () => {
    const form = Menu.open(player)
    if (form) form.show(player)
  }

  return new ActionForm('§aShp1nat§6Mine')
    .addButton(tp('spawn', inv, '§9', 'Спавн'), () => {
      Spawn.portal?.teleport(player)
    })
    .addButton(tp('anarchy', inv, '§c', 'Анархия'), () => {
      Anarchy.portal?.teleport(player)
    })
    .addButton(tp('mg', inv, `§6`, `Миниигры`, `\n§7СКОРО!`), soon)
    .addButton('Квесты', () => questsMenu(player, () => Menu.open(player)))
    .addButton('База', () => openBaseMenu(player, () => Menu.open(player)))
    .addButton('§6Донат\n§7СКОРО!', soon)
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.give?.(player, { mode: 'ensure' })
})
