import { Player } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { MessageForm } from 'lib.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { Quest } from 'modules/Quests/Quest.js'

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
  for (const [name, q] of Object.entries(Quest.instances)) {
    form.addButton(name, () => {
      q.enter(ctx.sender)
    })
  }
  form.show(ctx.sender)
})

/**
 * @param {Player} player
 * @param {VoidFunction} [backButton]
 */
export function questsMenu(player, backButton) {
  const quests = player.database.quests

  // Action form cannot contain no buttons
  // So if there is no back button show no quests as button
  const form = new ActionForm('Задания', !quests ? '§cНет активных заданий.' : '')
  if (backButton) form.addButtonBack(backButton)

  if (quests) {
    for (const dbquest of quests.active) {
      const quest = Quest.instances[dbquest.id]
      if (quest) {
        form.addButton(`${quest.name}\n${quest.steps(player)?.list[dbquest.step]?.text() ?? ''}`, () =>
          questMenu(player, quest, () => questsMenu(player, backButton))
        )
      }
    }
  }

  form.show(player)
}

/**
 * @param {Player} player
 * @param {Quest} quest
 */
function questMenu(player, quest, back = () => {}) {
  const current = quest.current(player)
  if (!current)
    return new MessageForm('§cНет задания', '§4Нет активного задания').setButton1('Назад', back).show(player)

  const form = new ActionForm(
    quest.name,
    `${quest.description}§r\n\n${current.text()}§r\n${current.description?.() ?? ''}`
  )
  form.addButtonBack(back)
  form.addButtonPrompt('§cОтказаться от задания', '§cОтказаться', () => quest.exit(player), 'Назад')
  form.show(player)
}
