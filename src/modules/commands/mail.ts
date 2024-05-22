import { Player } from '@minecraft/server'
import { ActionForm, ArrayForm, Mail, Menu, Settings, prompt, util } from 'lib'
import { Join } from 'lib/player-join'
import { Rewards } from 'lib/rewards'

new Command('mail').setDescription('Посмотреть входящие сообщения почты').executes(ctx => mailMenu(ctx.player))

const getSettings = Settings.player(...Menu.settings, {
  mailReadOnOpen: {
    name: 'Читать письмо при открытии',
    description: 'Помечать ли письмо прочитанным при открытии',
    value: true,
  },
  mailClaimOnDelete: {
    name: 'Собирать награды при удалении',
    description: 'Собирать ли награды при удалении письма',
    value: true,
  },
})

const getJoinSettings = Settings.player(...Join.settingsName, {
  unreadMails: {
    name: 'Почта',
    description: 'Показывать ли при входе сообщение с кол-вом непрочитанных',
    value: true,
  },
})

export function mailMenu(player: Player, back?: VoidFunction) {
  new ArrayForm(`Почта${Mail.unreadBadge(player.id)}`, 'Входящие', Mail.getLetters(player.id), {
    filters: {
      unread: {
        name: 'Непрочитанные',
        description: 'Показывать только непрочитанные сообщения',
        value: false,
      },
      unclaimed: {
        name: 'Несобранные награды',
        description: 'У письма есть несобранные награды',
        value: false,
      },
      sort: {
        name: 'Соритровать по',
        value: [
          ['date', 'Дате'],
          ['name', 'Имени'],
        ],
      },
    },
    button({ letter, index }) {
      const name = `${letter.read ? '§7' : '§f'}${letter.title}${letter.read ? '\n§8' : '§c*\n§7'}${letter.content}`
      return [
        name,
        null,
        () => {
          letterDetailsMenu({ letter, index }, player)
          if (getSettings(player).mailReadOnOpen) Mail.readMessage(player.id, index)
        },
      ]
    },

    sort(keys, filters) {
      if (filters.unread) keys = keys.filter(letter => !letter.letter.read)

      if (filters.unclaimed) keys = keys.filter(letter => !letter.letter.rewardsClaimed)

      filters.sort === 'name'
        ? keys.sort((letterA, letterB) => letterA.letter.title.localeCompare(letterB.letter.title))
        : keys.reverse()

      return keys
    },
    back,
  }).show(player)
}

function letterDetailsMenu(
  { letter, index }: ReturnType<(typeof Mail)['getLetters']>[number],
  player: Player,
  back = () => mailMenu(player),
  message = '',
) {
  const settings = getSettings(player)
  const form = new ActionForm(
    letter.title,
    message + letter.content + '\n\n§l§fНаграды:§r\n' + Rewards.restore(letter.rewards).toString(),
  ).addButtonBack(back)

  if (!letter.rewardsClaimed && letter.rewards.length)
    form.addButton('Забрать награду', () => {
      Mail.claimRewards(player, index)
      letterDetailsMenu({ letter, index }, player, back, message + '§aНаграда успешно забрана!\n\n§r§f')
    })

  if (!letter.read && !settings.mailReadOnOpen)
    form.addButton('Пометить как прочитанное', () => {
      Mail.readMessage(player.id, index)
      back()
    })

  let deleteDescription = '§cУдалить письмо?'
  if (!letter.rewardsClaimed) {
    if (getSettings(player).mailClaimOnDelete) {
      deleteDescription += ' Все награды будут собраны автоматически'
    } else {
      deleteDescription += ' Вы потеряете все награды, прикрепленные к письму!'
    }
  }

  form.addButton('§cУдалить письмо', null, () => {
    prompt(player, deleteDescription, '§cУдалить', () => {
      if (getSettings(player).mailClaimOnDelete) Mail.claimRewards(player, index)
      Mail.deleteMessage(player, index)
      back()
    })
  })

  form.show(player)
}

Join.onMoveAfterJoin.subscribe(({ player }) => {
  if (!getJoinSettings(player).unreadMails) return
  const unreadCount = Mail.getUnreadMessagesCount(player.id)
  if (unreadCount === 0) return
  player.info(
    `§f§lПочта: §r§7У вас §f${unreadCount} §7${util.ngettext(unreadCount, ['непрочитанное сообщение', 'непрочитанных сообщения', 'непрочитанных сообщений'])}! Посмотреть: §f.mail`,
  )
})
