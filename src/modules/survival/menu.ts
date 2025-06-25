import { BUTTON } from 'lib'
import { achievementsForm, achievementsFormName } from 'lib/achievements/command'
import { clanMenu } from 'lib/clan/menu'
import { Core } from 'lib/extensions/core'
import { form } from 'lib/form/new'
import { t } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { Join } from 'lib/player-join'
import { questsMenu } from 'lib/quest/menu'
import { Menu } from 'lib/rpg/menu'
import { playerSettingsMenu } from 'lib/settings'
import { mailMenu } from 'modules/commands/mail'
import { baseMenu } from 'modules/places/base/base-menu'
import { wiki } from 'modules/wiki/wiki'
import { Anarchy } from '../places/anarchy/anarchy'
import { Spawn } from '../places/spawn'

function tp(place: InventoryTypeName, inv: InventoryTypeName, color = '§9', text = t`Спавн`, extra = '') {
  const here = inv === place
  if (here) extra = t`${extra ? extra + ' ' : ''}§8Вы тут`
  if (extra) extra = '\n' + extra
  const prefix = here ? '§7' : color
  return `${prefix}> ${inv === place ? '§7' : '§r§f'}${text} ${prefix}<${extra}`
}

Menu.form = form((f, { player, self }) => {
  const inv = player.database.inv
  f.title(Core.name, '§c§u§s§r')
  f.button(tp('spawn', inv, '§9', t`Спавн`), 'textures/ui/worldsIcon', () => {
    Spawn.portal?.teleport(player)
  })
    .button(tp('anarchy', inv, '§c', t`Анархия`), 'textures/blocks/tnt_side', () => {
      Anarchy.portal?.teleport(player)
    })
    .button(tp('mg', inv, `§6`, t`Миниигры`, t`§7СКОРО!`), 'textures/blocks/bedrock', self)
    .button(t`Задания${t.badge(player.database.quests?.active.length)}`, 'textures/ui/sidebar_icons/genre', () =>
      questsMenu(player, self),
    )

  if (player.database.inv === 'anarchy') {
    f.button(t`База`, 'textures/blocks/barrel_side', baseMenu({}))
    const [clanText, clan] = clanMenu(player, self)
    f.button(clanText, 'textures/ui/FriendsIcon', clan)
  }

  f.button(t.nocolor`§6Донат\n§7СКОРО!`, 'textures/ui/permissions_op_crown', self)
    .button(t.nocolor`§fПочта${Mail.unreadBadge(player.id)}`, 'textures/ui/feedIcon', () => mailMenu(player, self))
    .button(t.nocolor`§bВики`, BUTTON.search, wiki.show)
    .button(achievementsFormName(player), 'textures/blocks/gold_block', achievementsForm)
    .button(t.nocolor`§7Настройки`, BUTTON.settings, () => playerSettingsMenu(player, self))
})

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) Menu.item.give(player, { mode: 'ensure' })
})
