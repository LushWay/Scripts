import { ActionForm, FormCallback, util } from 'lib.js'
import { Mail } from 'lib/Mail.js'
import { Menu } from 'lib/Menu.js'
import { Join } from 'lib/PlayerJoin.js'
import { mailMenu } from 'modules/Commands/mail.js'
import { playerSettingsMenu } from 'modules/Commands/settings.js'
import { openBaseMenu } from 'modules/Features/baseMenu.js'
import { questsMenu } from 'modules/Quests/questMenu.js'
import { Anarchy } from '../Places/Anarchy.js'
import { Spawn } from '../Places/Spawn.js'

/**
 * @param {InventoryTypeName} place
 * @param {InventoryTypeName} inv
 */
function tp(place, inv, color = '§9', text = 'Спавн', extra = '') {
  const here = inv === place
  if (here) extra = `${extra ? extra + ' ' : ''}§8Вы тут`
  if (extra) extra = '\n' + extra
  const prefix = here ? '§7' : color
  return `${prefix}> ${inv === place ? '§7' : '§r§f'}${text} ${prefix}<${extra}`
}

Menu.open = player => {
  const inv = player.database.inv
  const back = () => {
    const menu = Menu.open(player)
    if (menu) menu.show(player)
  }

  /** @type {ActionForm} */
  const form = new ActionForm(Core.name, '', '§c§u§s§r')
    .addButton(tp('spawn', inv, '§9', 'Спавн'), 'textures/ui/worldsIcon', () => {
      Spawn.portal?.teleport(player)
    })
    .addButton(tp('anarchy', inv, '§c', 'Анархия'), 'textures/blocks/tnt_side', () => {
      Anarchy.portal?.teleport(player)
    })
    .addButton(tp('mg', inv, `§6`, `Миниигры`, `§7СКОРО!`), 'textures/blocks/bedrock', back)
    .addButton(
      util.badge('Задания', player.database.quests?.active.length ?? 0),
      'textures/ui/sidebar_icons/genre',
      () => questsMenu(player, back)
    )

  if (player.database.inv === 'anarchy')
    form
      .addButton('База', 'textures/blocks/barrel_side', () =>
        openBaseMenu(player, back, message => new FormCallback(form, player).error(message))
      )
      .addButton('§6Кланы\n§7СКОРО!', 'textures/ui/permissions_op_crown', back)

  form
    .addButton('§6Донат\n§7СКОРО!', 'textures/ui/permissions_op_crown', back)
    .addButton(`§fПочта${Mail.unreadBadge(player.id)}`, 'textures/ui/gear', () => mailMenu(player, back))
    .addButton('§7Настройки', 'textures/ui/gear', () => playerSettingsMenu(player, back))

  return form
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.give?.(player, { mode: 'ensure' })
})
