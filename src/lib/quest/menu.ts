import { Player } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm } from 'lib/form/message'
import { form } from 'lib/form/new'
import { is } from 'lib/roles'
import { t } from 'lib/text'
import { noNullable } from 'lib/util'
import { Vector } from 'lib/vector'
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
    const step = Quest.getCurrentStepOf(ctx.player)
    if (!step) return ctx.error('У вас нет активных заданий!')

    step.quest.exit(ctx.player)
    ctx.player.success()
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

      return [`${quest.name}\n${step.text()}`, () => manageQuestMenu(quest).show(player, self)]
    })
    .back(back)
    .show(player)
}

function completeQuestsMenu(player: Player, back: VoidFunction) {
  const { quests } = player.database
  if (!quests) return

  new ArrayForm('Завершенные задания', quests.completed.map(e => Quest.quests.get(e)).filter(noNullable))
    .description('Список завершенных заданий')
    .button(
      quest => [quest.name, () => manageQuestMenu(quest).show(player, () => completeQuestsMenu(player, back))] as const,
    )
    .back(back)
    .show(player)
}

export function manageQuestMenu(quest: Quest) {
  return form((f, player, back) => {
    const current = quest.getPlayerStep(player)
    let currentDescription = ''
    if (current) {
      currentDescription = `${current.text()}§r\n${current.description?.() ?? ''}${current.place ? `\n${Vector.string(current.place, true)}` : ''}`
    } else if (quest.isCompleted(player)) {
      currentDescription = '§aЗадание завершено!'
    }

    f.title(quest.name)
    f.body(`${quest.description}§r\n\n${currentDescription}`)

    if (Quest.getCurrentStepOf(player) !== quest.getPlayerStep(player)) {
      f.button('Сделать приоритетным', () => {
        if (!player.database.quests) return

        const active = Quest.getDatabase(player, quest)
        if (!active) return

        player.database.quests.active = player.database.quests.active.filter(e => e !== active)
        player.database.quests.active.unshift(active)
      })
    }

    f.ask(
      '§cОтказаться от задания',
      '§cОтказаться',
      () => (quest.exit(player, undefined, true), back?.(player)),
      'Назад',
    )

    const place = current?.place
    if (is(player.id, 'techAdmin') && place) f.button('§7admin: tp to quest point', () => player.teleport(place))
  })
}
