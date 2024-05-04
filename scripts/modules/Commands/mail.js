// TODO(milkcool) Remaining implementation

import { CommandContext } from 'lib/Command/Context.js'
import { ActionForm, ArrayForm, Mail } from 'lib.js'
import { Join } from 'lib/PlayerJoin.js'
import { Rewards } from 'lib/Rewards.js'

new Command({
  name: 'mail',
  description: 'Посмотреть входящие сообщения', // TODO
}).executes(mailMenu)

/**
 * @param {CommandContext} ctx
 * @param {VoidFunction} [back]
 */
export function mailMenu(ctx, back) {
  const form = new ArrayForm('Почта', 'Входящие', Mail.getLetters(ctx.sender.id), {
    button(item) {
      let globalLetter
      if (item.letter.id) globalLetter = Mail.followLetter(item.letter)
      const name = globalLetter ? globalLetter.title : item.letter.title ?? 'Без названия'
      const content = globalLetter ? globalLetter.content : item.letter.content ?? 'Без содержания'
      const viewForm = new ActionForm(
        name,
        content + '\n\n§l§fНаграды:§r\n' + new Rewards().restore(item.letter.rewards ?? []).toString(),
      )
      viewForm.addButtonBack(() => mailMenu(ctx))
      if (!item.letter.rewardsClaimed && item.letter.rewards?.length)
        viewForm.addButton('Забрать награду', () => {
          Mail.claimRewards(ctx.sender, item.index)
          mailMenu(ctx)
        })
      if (!item.letter.read)
        viewForm.addButton('Пометить как прочитанное', () => {
          Mail.readMessage(ctx.sender.id, item.index)
          mailMenu(ctx)
        })
      viewForm.addButton('Удалить', () => {
        Mail.deleteMessage(ctx.sender, item.index)
        mailMenu(ctx)
      })
      return [name, null, () => viewForm.show(ctx.sender)]
    },
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
        name: 'Соритровать по...',
        value: [
          ['date', 'Дате'],
          ['name', 'Имени'],
        ],
      },
    },
    sort(keys, filters) {
      if (filters.unread) keys = keys.filter(letter => !letter.letter.read)
      if (filters.unclaimed) keys = keys.filter(letter => !letter.letter.rewardsClaimed)
      filters.sort === 'name'
        ? keys.sort((letterA, letterB) => ((letterA.letter.title ?? '0') > (letterB.letter.title ?? '0') ? 1 : -1))
        : keys.reverse()
      return keys
    },
    back,
  })

  form.show(ctx.sender)
}

Join.onMoveAfterJoin.subscribe(({ player }) => {
  const unreadCount = Mail.getUnreadMessagesCount(player.id)
  if (unreadCount == 0) return
  player.sendMessage(`§l§eУ вас ${unreadCount} непрочитанных сообщений!`)
})

