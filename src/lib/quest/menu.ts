import { Player } from '@minecraft/server'
import { MessageForm, noNullable } from 'lib'
import { Sounds } from 'lib/assets/config'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { t } from 'lib/text'
import { Quest } from './quest'

const quest = new Command('q')
  .setAliases('quest')
  .setDescription('Меню заданий')
  .setPermissions('member')
  .executes(ctx => questsMenu(ctx.player))

quest
  .overload('exit')
  .setDescription('Выйти')
  .executes(ctx => {
    const q = Quest.getCurrent(ctx.player)
    if (!q) return ctx.error('У вас нет активных заданий!')

    q.quest.exit(ctx.player)
    ctx.player.playSound(Sounds.Success)
    ctx.reply('§6> §fУспешно')
  })

quest
  .overload('enter')
  .setPermissions('techAdmin')
  .executes(ctx => {
    const form = new ActionForm('Quests', 'Выбери')
    for (const [name, q] of Quest.quests.entries()) {
      form.addButton(name, () => {
        q.enter(ctx.player)
      })
    }
    form.show(ctx.player)
  })

export function questsMenu(player: Player, back?: VoidFunction) {
  const { quests } = player.database
  if (!quests)
    return new MessageForm('§3Задания', '§cНет заданий')
      .setButton1(back ? ActionForm.backText : '§3Закрыть', back ?? (() => false))
      .show(player)

  const self = () => questsMenu(player, back)

  new ArrayForm('§3Задания', quests.active)
    .description(!quests.active.length ? 'Нет активных заданий.' : '')
    .addCustomButtonBeforeArray(form => {
      form.addButton(t.badge`§3Завершенные задания ${quests.completed.length}`, () => completeQuestsMenu(player, self))
    })
    .button(dbquest => {
      const quest = Quest.quests.get(dbquest.id)
      const step = quest?.getPlayerStep(player, dbquest.i)
      if (!step || !quest) return false

      return [`${quest.name}\n${step.text()}`, () => questMenu(player, quest, self)]
    })
    .back(back)
    .show(player)
}

function completeQuestsMenu(player: Player, back: VoidFunction) {
  const { quests } = player.database
  if (!quests) return

  new ArrayForm('Завершенные задания', quests.completed.map(e => Quest.quests.get(e)).filter(noNullable))
    .description('Список завершенных заданий')
    .button(quest => [quest.name, () => questMenu(player, quest, () => completeQuestsMenu(player, back))])
    .back(back)
    .show(player)
}

function questMenu(player: Player, quest: Quest, back: VoidFunction) {
  const current = quest.getPlayerStep(player)
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
