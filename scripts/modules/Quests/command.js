import { Player } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { MessageForm } from 'lib.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { Quest } from 'lib/Quest.js'

const quest = new Command({
  name: 'q',
  aliases: ['quest'],
  description: 'Меню квеста',
  role: 'member',
}).executes(ctx => {
  questsMenu(ctx.sender)
})

quest.literal({ name: 'exit', description: 'Выйти' }).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('У вас нет активных квестов!')
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
 * @param {VoidFunction} [back]
 */
export function questsMenu(player, back) {
  const form = new ActionForm('Квесты')
  if (back) form.addButtonBack(back)

  if (player.database.quests) {
    for (const dbquest of player.database.quests.active) {
      const quest = Quest.instances[dbquest.id]
      if (quest) {
        form.addButton(`${quest.name}\n${quest.steps(player)?.list[dbquest.step]?.text() ?? ''}`, () =>
          questMenu(player, quest, () => questsMenu(player, back))
        )
      }
    }
  } else form.addButton('§cНет активных квестов.', () => questsMenu(player, back))

  form.show(player)
}

/**
 * @param {Player} player
 * @param {Quest} quest
 */
function questMenu(player, quest, back = () => {}) {
  const current = quest.current(player)
  if (!current) return new MessageForm('§cНет квеста', '§4Нет активного квеста').setButton1('Назад', back).show(player)

  const form = new ActionForm(
    'Квест ' + quest.name,
    `${quest.description}\n\n${current.text()}\n\n${current.description?.() ?? ''}`
  )
  form.addButtonBack(back)
  form.addButtonPrompt('§cОтказаться от квеста', '§cОтказаться', () => quest.exit(player), 'Назад')
  form.show(player)
}
