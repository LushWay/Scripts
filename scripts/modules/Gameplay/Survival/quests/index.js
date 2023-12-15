import { Quest } from 'lib/Class/Quest.js'
import importModules from 'modules/importModules.js'
import { ActionForm } from 'smapi.js'

importModules({ array: ['./learning.js'], fn: m => import(m) })

const qcmd = new Command({
  name: 'q',
  role: 'member',
}).executes(ctx => {
  const q = Quest.active(ctx.sender)
  if (!q) return ctx.error('Вы не находитесь в квесте!')
  return ctx.reply(
    `§6${q.quest.displayName}\n\nЗадание: §f${q.step.text()}§7${
      q.step.description ? 'Описание: ' + q.step.description() + '\n' : ''
    }§6Выйти из квеста: §f-q exit`
  )
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
