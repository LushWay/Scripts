import { SOUNDS } from 'config.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { Quest } from 'lib/Quest.js'

const quest = new Command({
  name: 'q',
  aliases: ['quest'],
  description: 'Меню квеста',
  role: 'member',
}).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('У вас нет активных квестов')
  return ctx.reply(
    `§7Квест: §6${q.quest.displayName}\n\n§7Квест: §f${q.step.text()}\n${
      q.step.description ? `§7Описание: ${q.step.description()}\n` : ''
    }\n§6Выйти из квеста: §f.q exit`
  )
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
