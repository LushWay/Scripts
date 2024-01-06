import { SOUNDS } from 'config.js'
import { Quest } from 'lib/Class/Quest.js'
import importModules from 'modules/importModules.js'
import { ActionForm } from 'smapi.js'

importModules({ array: ['./Learning/index.js'], fn: m => import(m) })

const qcmd = new Command({
  name: 'q',
  aliases: ['quest'],
  description: 'Меню квеста',
  role: 'member',
}).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('Вы не находитесь в квесте!')
  return ctx.reply(
    `§7Квест: §6${q.quest.displayName}\n\n§7Задание: §f${q.step.text()}\n${
      q.step.description ? `§7Описание: ${q.step.description()}\n` : ''
    }\n§6Выйти из квеста: §f-q exit`
  )
})

qcmd.literal({ name: 'exit', description: 'Выйти' }).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('Вы не находитесь в квесте!')
  q.quest.exit(ctx.sender)
  ctx.sender.playSound(SOUNDS.success)
  ctx.reply('§6> §fУспешно')
})

qcmd.literal({ name: 'enter', role: 'admin' }).executes(ctx => {
  const form = new ActionForm('Quests', 'Выбери')
  for (const [name, q] of Object.entries(Quest.instances)) {
    form.addButton(name, () => {
      q.enter(ctx.sender)
    })
  }
  form.show(ctx.sender)
})
