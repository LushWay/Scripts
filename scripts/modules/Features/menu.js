import { ActionForm } from 'lib.js'
import { Menu } from 'lib/Menu.js'
import { Join } from 'lib/PlayerJoin.js'
import { openBaseMenu } from 'modules/Features/baseMenu.js'
import { questsMenu } from 'modules/Quests/command.js'
import { Anarchy } from '../Places/Anarchy.js'
import { Spawn } from '../Places/Spawn.js'

/**
 * @param {InventoryTypeName} place
 * @param {InventoryTypeName} inv
 */
function tp(place, inv, color = '§9', text = 'Спавн', extra = '') {
  const here = inv === place
  if (here) extra = `${extra ? extra + ' ' : ''}§7Вы тут`
  if (extra) extra = '\n' + extra
  const prefix = here ? '§7' : color
  return `${prefix}> ${inv === place ? '§8' : '§f'}${text} ${prefix}<${extra}`
}

Menu.open = player => {
  const inv = player.database.inv
  const soon = () => {
    const form = Menu.open(player)
    if (form) form.show(player)
  }

  return new ActionForm('§aLush§6Way', '', '§c§u§s§r')
    .addButton(tp('spawn', inv, '§9', 'Спавн'), 'textures/ui/worldsIcon', () => {
      Spawn.portal?.teleport(player)
    })
    .addButton(tp('anarchy', inv, '§c', 'Анархия'), 'textures/blocks/tnt_side', () => {
      Anarchy.portal?.teleport(player)
    })
    .addButton(tp('mg', inv, `§6`, `Миниигры`, `§7СКОРО!`), 'textures/blocks/bedrock', soon)
    .addButton('Квесты', 'textures/ui/sidebar_icons/genre', () => questsMenu(player, () => Menu.open(player)))
    .addButton('База', 'textures/blocks/barrel_side', () => openBaseMenu(player, () => Menu.open(player)))
    .addButton('§6Донат\n§7СКОРО!', 'textures/ui/permissions_op_crown', soon)
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.give?.(player, { mode: 'ensure' })
})
