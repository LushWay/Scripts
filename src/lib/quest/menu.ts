import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm } from 'lib/form/message'
import { form } from 'lib/form/new'
import { is } from 'lib/roles'
import { l, t } from 'lib/text'
import { noNullable } from 'lib/util'
import { Vec } from 'lib/vector'
import { Quest } from './quest'

const quest = new Command('q')
  .setAliases('quest')
  .setDescription(t`Меню заданий`)
  .setPermissions('member')
  .executes(ctx => questsMenu(ctx.player))

quest
  .overload('exit')
  .setDescription(t`Выйти`)
  .executes(ctx => {
    const step = Quest.getCurrentStepOf(ctx.player)
    if (!step) return ctx.error(t`У вас нет активных заданий!`)

    step.quest.exit(ctx.player)
    ctx.player.success()
  })

quest
  .overload('enter')
  .setPermissions('techAdmin')
  .executes(ctx => {
    const form = new ActionForm('Quests', l`Select`)
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
    return new MessageForm(t`§3Задания`, t.error`Нет заданий`)
      .setButton1(back ? ActionForm.backText : t`§3Закрыть`, back ?? (() => false))
      .show(player)

  const self = () => questsMenu(player, back)

  new ArrayForm(t`§3Задания`, quests.active)
    .description(!quests.active.length ? t`Нет активных заданий.` : '')
    .addCustomButtonBeforeArray(form => {
      form.addButton(t`§3Завершенные задания${t.size(quests.completed.length)}`, () => completeQuestsMenu(player, self))
    })
    .button(dbquest => {
      const quest = Quest.quests.get(dbquest.id)
      const step = quest?.getCurrentStep(player, dbquest.i)
      if (!step || !quest) return false

      return [`${quest.name}\n§7${step.text()}`, () => manageQuestMenu(quest).show(player, self)]
    })
    .back(back)
    .show(player)
}

function completeQuestsMenu(player: Player, back: VoidFunction) {
  const { quests } = player.database
  if (!quests) return

  new ArrayForm(t`Завершенные задания`, quests.completed.map(e => Quest.quests.get(e)).filter(noNullable))
    .description(t`Список завершенных заданий`)
    .button(
      quest => [quest.name, () => manageQuestMenu(quest).show(player, () => completeQuestsMenu(player, back))] as const,
    )
    .back(back)
    .show(player)
}

export function manageQuestMenu(quest: Quest) {
  return form((f, player, back) => {
    const current = quest.getCurrentStep(player)
    let currentDescription = ''
    if (current) {
      currentDescription = t`Текущее действие: ${current.text()}\nОписание действия: ${current.description?.() ?? ''}\nЛокация: ${current.target ? Vec.string(current.target.location, true) : ''}`
      if (current.target?.dimensionType !== 'overworld') {
        currentDescription += t`\nИзмерение: ${current.target?.dimensionType}`
      }
    } else if (quest.isCompleted(player)) {
      currentDescription = t`§aЗадание завершено!`
    }

    f.title(quest.name)
    f.body(t`Описание задания: ${quest.description}\n\n${currentDescription}`)

    if (Quest.getCurrentStepOf(player) !== quest.getCurrentStep(player)) {
      f.button(t`Сделать приоритетным`, () => {
        if (!player.database.quests) return

        const active = quest.getDatabase(player)
        if (!active) return

        player.database.quests.active = player.database.quests.active.filter(e => e !== active)
        player.database.quests.active.unshift(active)
      })
    }

    f.ask(
      t`§cОтказаться от задания`,
      t`§cОтказаться`,
      () => (quest.exit(player, undefined, true), back?.(player)),
      t`Назад`,
    )

    const place = current?.target
    if (is(player.id, 'techAdmin') && place)
      f.button('§7admin: tp to quest point', () =>
        player.teleport(place.location, { dimension: world[place.dimensionType] }),
      )
  })
}
