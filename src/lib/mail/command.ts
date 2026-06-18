import { Player, world } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { ArrayForm } from 'lib/form/array'
import { ask } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { BUTTON } from 'lib/form/utils'
import { i18n, textTable } from 'lib/i18n/text'
import { Mail } from 'lib/mail'
import { Join } from 'lib/player-join'
import { is } from 'lib/roles'
import { Settings } from 'lib/settings'
import { Rewards } from 'lib/utils/rewards'

const command = new Command('mail')
  .setDescription(i18n`Посмотреть входящие сообщения почты`)
  .setPermissions('member')
  .executes(ctx => mailMenu(ctx.player))

const mailGroup = [i18n`Почта\n§7Прочтение сообщения, инфо при входе`, 'mail'] as const

const getSettings = Settings.player(...mailGroup, {
  mailClaimOnDelete: {
    name: i18n`Собирать награды при удалении`,
    description: i18n`Собирать ли награды при удалении письма`,
    value: true,
  },
})

const getJoinSettings = Settings.player(...Join.getPlayerSettings.extend, {
  unreadMails: {
    name: i18n`Почта`,
    description: i18n`Показывать ли при входе сообщение с кол-вом непрочитанных`,
    value: true,
  },
})

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (!getJoinSettings(player).unreadMails) return

  const unreadCount = Mail.getUnreadMessagesCount(player.id)
  if (unreadCount === 0) return

  player.info(i18n.join`${i18n.header`Почта:`} ${i18n`У вас ${unreadCount} непрочитанных сообщений!`} ${command}`)
})

export function mailMenu(player: Player, back?: VoidFunction) {
  const letters = Mail.getLetters(player.id)
  new ArrayForm(i18n`Почта`.badge(Mail.getUnreadMessagesCount(player.id)), letters)
    .filters({
      unread: {
        name: i18n`Непрочитанные`,
        description: i18n`Показывать только непрочитанные сообщения`,
        value: false,
      },
      unclaimed: {
        name: i18n`Несобранные награды`,
        description: i18n`У письма есть несобранные награды`,
        value: false,
      },
      sort: {
        name: i18n`Сортировать по`,
        value: [
          ['date', i18n`Дате`],
          ['name', i18n`Имени`],
        ],
      },
    })
    .addCustomButtonBeforeArray((f, _, back) => {
      if (letters.length) {
        f.button(i18n`Прочитать все
§7(и собрать награды если есть)`, () => {
          Mail.readAllAndClaimRewards(player)
          player.success()
          mailMenu(player)
        })
      } else {
        f.button(i18n`Все прочитано`, back)
      }

      if (is(player.id, 'moderator')) {
        f.button(i18n`Объявление`, BUTTON['+'], () => {
          new ModalForm(i18n`Объявление для всего сервера`)
            .addTextField(i18n`Заголовок`, i18n`вы крутые там д0а`)
            .addTextField(i18n`Строка 1`, i18n`мы вас поздравляем`)
            .addTextField(i18n`Строка2`, i18n`вы теперь можете`)
            .addTextField(i18n`Строка3`, i18n`читать все сообщения в почте`)
            .addTextField(i18n`Строка 4`, i18n`да`)
            .addTextField(i18n`Строка5`, i18n`вот.`)
            .addSlider(i18n`Алмазов за прочтение`, 0, 100, 1, 5)
            .show(player, (ctx, ...args) => {
              const diamonds = args.pop() as number
              const rewards = new Rewards()
              if (diamonds) rewards.item(MinecraftItemTypes.Diamond, diamonds)
              Mail.sendMultiple(
                [...Player.database.keys()],
                i18n`${args[0]}`,
                i18n`${args.slice(1).filter(Boolean).join('\n')}`,
                rewards,
              )
              mailMenu(player)
            })
        })
      }
    })
    .button(({ letter, index }) => {
      const name = `${letterOneLineName(letter)}${letter.read ? '\n§8' : '\n§7'}${letter.content.replace(/§./g, '')}`
      return [name, letterDetailsMenu({ letter, index, letters }).show]
    })
    .sort((keys, filters) => {
      if (filters.unread) keys = keys.filter(letter => !letter.letter.read)

      if (filters.unclaimed) keys = keys.filter(letter => !letter.letter.rewardsClaimed)

      filters.sort === 'name'
        ? keys.sort((letterA, letterB) => letterA.letter.title.localeCompare(letterB.letter.title))
        : keys.reverse()

      return keys
    })
    .back(back)
    .show(player)
}

function letterOneLineName(letter: Mail.Letter.Local) {
  return `${letter.read ? '§7' : '§f'}${letter.title.replace(/§./g, '')}${letter.read ? '' : '§c*'}`
}

const letterDetailsMenu = form.params<{
  index: number
  letter: Mail.Letter.Local
  letters: { letter: Mail.Letter.Local; index: number }[]
  message?: Text
}>((f, { player, back, params: { index, letter, letters, message } }) => {
  f.title(letterOneLineName(letter))
  f.body(
    i18n`${message}${letter.content}\n\n${textTable([[i18n`Награды`, Rewards.restore(letter.rewards).toString(player)]])}`,
  )
  const withMessage = (message: Text) => letterDetailsMenu({ index, letter, letters, message }).show(player, back)

  if (!letter.rewardsClaimed && letter.rewards.length)
    if (player.database.inv !== 'anarchy') {
      f.button(i18n.disabled`Забрать награду`, () =>
        withMessage(i18n.error`Вы не можете забрать награды не находясь на анархии`),
      )
    } else {
      f.button(i18n`Забрать награду`, () => {
        Mail.claimRewards(player, index)
        withMessage(i18n.join`${message}${i18n.success`Награда успешно забрана!\n\n`}`)
      })
    }

  const next = letters[index + 1]
  if (next) {
    f.button(i18n.nocolor`Следующее письмо\n${letterOneLineName(next.letter)}`, BUTTON['>'], () =>
      letterDetailsMenu({ ...next, letters }).show(player, back),
    )
  }

  const prev = letters[index - 1]
  if (prev) {
    f.button(i18n.nocolor`Предыдущее письмо\n${letterOneLineName(prev.letter)}`, BUTTON['<'], () =>
      letterDetailsMenu({ ...prev, letters }).show(player, back),
    )
  }

  let deleteDescription = i18n.error`Удалить письмо?`
  if (!letter.rewardsClaimed) {
    if (getSettings(player).mailClaimOnDelete) {
      deleteDescription = i18n`${deleteDescription} Все награды будут собраны автоматически`
    } else {
      deleteDescription = i18n.error`${deleteDescription} Вы потеряете все награды, прикрепленные к письму!`
    }
  }

  f.button(i18n.error`Удалить письмо`, null, () => {
    ask(player, deleteDescription, i18n`Удалить`, () => {
      if (getSettings(player).mailClaimOnDelete) Mail.claimRewards(player, index)
      Mail.deleteMessage(player, index)
      back?.(player)
    })
  })

  Mail.readMessage(player.id, index)
})
