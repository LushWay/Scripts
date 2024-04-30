import { Player } from '@minecraft/server'
import { MessageForm, util } from 'lib.js'
import { SOUNDS } from 'lib/Assets/config.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ArrayForm } from 'lib/Form/ArrayForm.js'
import { Quest } from 'modules/Quests/lib/Quest.js'

const quest = new Command({
  name: 'q',
  aliases: ['quest'],
  description: 'Меню заданий',
  role: 'member',
}).executes(ctx => {
  questsMenu(ctx.sender)
})

quest.literal({ name: 'exit', description: 'Выйти' }).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('У вас нет активных заданий!')
  q.quest.exit(ctx.sender)
  ctx.sender.playSound(SOUNDS.success)
  ctx.reply('§6> §fУспешно')
})

quest.literal({ name: 'enter', role: 'techAdmin' }).executes(ctx => {
  const form = new ActionForm('Quests', 'Выбери')
  for (const [name, q] of Object.entries(Quest.list)) {
    form.addButton(name, () => {
      q.enter(ctx.sender)
    })
  }
  form.show(ctx.sender)
})

/**
 * @param {Player} player
 * @param {VoidFunction} [back]
 */
export function questsMenu(player, back) {
  const { quests } = player.database
  if (!quests)
    return new MessageForm('§3Задания', '§cНет заданий')
      .setButton1(back ? ActionForm.backText : '§3Закрыть', back ?? (() => {}))
      .show(player)

  const self = () => questsMenu(player, back)

  new ArrayForm('§3Задания', !quests.active.length ? 'Нет активных заданий.' : '', quests.active, {
    filters: {},
    addCustomButtonBeforeArray(form) {
      form.addButton(util.badge('§3Завершенные задания', quests.completed.length), () =>
        completeQuestsMenu(player, self),
      )
    },
    button(dbquest) {
      const quest = Quest.list[dbquest.id]
      if (!quest) return false

      return [
        `${quest.name}\n${quest.steps(player)?.list[dbquest.step]?.text() ?? ''}`,
        null,
        () => questMenu(player, quest, self),
      ]
    },
    back,
  }).show(player)
}

/**
 * @param {Player} player
 * @param {VoidFunction} back
 */
function completeQuestsMenu(player, back) {
  const self = () => completeQuestsMenu(player, back)

  const { quests } = player.database
  if (!quests) return

  new ArrayForm(
    'Завершенные задания',
    'Список завершенных заданий',
    quests.completed.map(e => Quest.list[e]).filter(Boolean),
    {
      filters: {},
      button(quest, filters) {
        return [quest.name, null, () => questMenu(player, quest, self)]
      },
      back,
    },
  ).show(player)
}

/**
 * @param {Player} player
 * @param {Quest} quest
 */
function questMenu(player, quest, back = () => {}) {
  const current = quest.current(player)
  let currentDescription = ''
  if (current) {
    currentDescription = `${current.text()}§r\n${current.description?.() ?? ''}`
  } else if (player.database.quests?.completed.includes(quest.id)) {
    currentDescription = '§aЗадание завершено'
  }

  const form = new ActionForm(quest.name, `${quest.description}§r\n\n${currentDescription}`)
  form.addButtonBack(back)
  form.addButtonPrompt('§cОтказаться от задания', '§cОтказаться', () => quest.exit(player), 'Назад')
  form.show(player)
}
