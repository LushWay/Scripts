import { ActionForm } from 'lib.js'
import { Menu } from 'lib/Menu.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Anarchy } from '../Places/Anarchy.js'
import { Spawn } from '../Places/Spawn.js'

/**
 * @param {InventoryTypeName} place
 * @param {InventoryTypeName} inv
 */
function placeButton(place, inv, color = '§9', text = 'Спавн') {
  return `${inv === place ? '§7Вы тут ' : color}> ${inv === place ? '§8' : '§f'}${text}`
}

Menu.open = player => {
  const inv = player.database.inv
  return new ActionForm('§aShp1nat§6Mine')
    .addButton(placeButton('spawn', inv, '§9', 'Спавн'), () => {
      Spawn.portal?.teleport(player)
    })
    .addButton(placeButton('anarchy', inv, '§c', 'Анархия'), () => {
      Anarchy.portal?.teleport(player)
    })
    .addButton(placeButton('mg', inv, `§6`, `Миниигры\n§7СКОРО!`), () => {
      const form = Menu.open(player)
      if (form) form.show(player)
    })
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.give(player, { mode: 'ensure' })
})
