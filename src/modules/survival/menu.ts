import { ActionForm, BUTTON, FormCallback } from 'lib'
import { clanMenu } from 'lib/clan/menu'
import { Core } from 'lib/extensions/core'
import { Mail } from 'lib/mail'
import { Join } from 'lib/player-join'
import { achievementsForm } from 'lib/quest/achievements/command'
import { questsMenu } from 'lib/quest/menu'
import { Menu } from 'lib/rpg/menu'
import { playerSettingsMenu } from 'lib/settings'
import { t } from 'lib/text'
import { mailMenu } from 'modules/commands/mail'
import { openBaseMenu } from 'modules/places/base/base-menu'
import { wiki } from 'modules/wiki/wiki'
import { Anarchy } from '../places/anarchy/anarchy'
import { Spawn } from '../places/spawn'

function tp(place: InventoryTypeName, inv: InventoryTypeName, color = '§9', text = 'Спавн', extra = '') {
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

  const form: ActionForm = new ActionForm(Core.name, '', '§c§u§s§r')
    .addButton(tp('spawn', inv, '§9', 'Спавн'), 'textures/ui/worldsIcon', () => {
      Spawn.portal?.teleport(player)
    })
    .addButton(tp('anarchy', inv, '§c', 'Анархия'), 'textures/blocks/tnt_side', () => {
      Anarchy.portal?.teleport(player)
    })
    .addButton(tp('mg', inv, `§6`, `Миниигры`, `§7СКОРО!`), 'textures/blocks/bedrock', back)
    .addButton(t.badge`Задания ${player.database.quests?.active.length ?? 0}`, 'textures/ui/sidebar_icons/genre', () =>
      questsMenu(player, back),
    )

  if (player.database.inv === 'anarchy') {
    form.addButton('База', 'textures/blocks/barrel_side', () =>
      openBaseMenu(player, back, message => new FormCallback(form, player).error(message)),
    )
    const [clanText, clan] = clanMenu(player, back)
    form.addButton(clanText, 'textures/ui/FriendsIcon', clan)
  }

  form
    .addButton('§6Донат\n§7СКОРО!', 'textures/ui/permissions_op_crown', back)
    .addButton(`§fПочта${Mail.unreadBadge(player.id)}`, 'textures/ui/feedIcon', () => mailMenu(player, back))
    .addButton('§bВики', BUTTON.search, wiki.show)
    .addButton('§eДостижения', 'textures/blocks/gold_block', achievementsForm)
    .addButton('§7Настройки', BUTTON.settings, () => playerSettingsMenu(player, back))

  return form
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.item.give(player, { mode: 'ensure' })
})
