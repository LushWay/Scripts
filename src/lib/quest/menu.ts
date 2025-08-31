import { Player, world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm } from 'lib/form/message'
import { form } from 'lib/form/new'
import { i18n, noI18n } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { noNullable } from 'lib/util'
import { Vec } from 'lib/vector'
import { Quest } from './quest'

const quest = new Command('q')
  .setAliases('quest')
  .setDescription(i18n`Меню заданий`)
  .setPermissions('member')
  .executes(ctx => questsMenu(ctx.player))

quest
  .overload('exit')
  .setDescription(i18n`Выйти`)
  .executes(ctx => {
    const step = Quest.getCurrentStepOf(ctx.player)
    if (!step) return ctx.error(i18n`У вас нет активных заданий!`)

    step.quest.exit(ctx.player)
    ctx.player.success()
  })

quest
  .overload('enter')
  .setPermissions('techAdmin')
  .executes(
    form((f, { player }) => {
      f.title('Quests')
      f.body(noI18n`Select`)
      for (const [name, q] of Quest.quests.entries()) f.button(name, () => q.enter(player))
    }).command,
  )

export const questMenuCustomButtons = new EventSignal<{ player: Player; form: ActionForm }>()

export function questsMenu(player: Player, back?: VoidFunction) {
  const { quests } = player.database
  if (!quests)
    return new MessageForm(i18n.accent`Задания`.to(player.lang), i18n.error`Нет заданий`.to(player.lang))
      .setButton1(
        back ? ActionForm.backText.to(player.lang) : i18n.accent`Закрыть`.to(player.lang),
        back ?? (() => false),
      )
      .show(player)

  const self = () => questsMenu(player, back)

  new ArrayForm(i18n.accent`Задания`, quests.active)
    .description(!quests.active.length ? i18n`Нет активных заданий.` : '')
    .addCustomButtonBeforeArray(f => {
      f.button(i18n.accent`Завершенные задания`.size(quests.completed.length).to(player.lang), () =>
        completeQuestsMenu(player, self),
      )
      EventSignal.emit(questMenuCustomButtons, { player, form: f })
    })
    .button(dbquest => {
      const quest = Quest.quests.get(dbquest.id)
      const step = quest?.getCurrentStep(player, dbquest.i)
      if (!step || !quest) return false

      return [i18n.nocolor.join`${quest.name}\n§7${step.text()}`, manageQuestMenu({ quest }).show]
    })
    .back(back)
    .show(player)
}

function completeQuestsMenu(player: Player, back: VoidFunction) {
  const self = () => completeQuestsMenu(player, back)

  const { quests } = player.database
  if (!quests) return

  new ArrayForm(i18n.accent`Завершенные задания`, quests.completed.map(e => Quest.quests.get(e)).filter(noNullable))
    .description(i18n`Список завершенных заданий`)
    .button(quest => [quest.name, () => manageQuestMenu({ quest }).show(player, self)] as const)
    .back(back)
    .show(player)
}

export const manageQuestMenu = form.params<{ quest: Quest }>((f, { player, back, params: { quest } }) => {
  const current = quest.getCurrentStep(player)
  let currentDescription = ''
  if (current) {
    currentDescription =
      i18n`Текущее действие: ${current.text()}\nОписание действия: ${current.description?.() ?? ''}\nЛокация: ${current.target ? Vec.string(current.target.location, true) : ''}`.to(
        player.lang,
      )
    if (current.target?.dimensionType !== 'overworld') {
      currentDescription += i18n`\nИзмерение: ${current.target?.dimensionType}`.to(player.lang)
    }
  } else if (quest.isCompleted(player)) {
    currentDescription = i18n.success`Задание завершено!`.to(player.lang)
  }

  f.title(quest.name)
  f.body(i18n`Описание задания: ${quest.description}\n\n${currentDescription}`)

  if (Quest.getCurrentStepOf(player) !== quest.getCurrentStep(player)) {
    f.button(i18n`Сделать приоритетным`, () => {
      if (!player.database.quests) return

      const active = quest.getDatabase(player)
      if (!active) return

      player.database.quests.active = player.database.quests.active.filter(e => e !== active)
      player.database.quests.active.unshift(active)
    })
  }

  f.ask(
    i18n.error`Отказаться от задания`,
    i18n.error`Отказаться`,
    () => (quest.exit(player, undefined, true), back?.(player)),
    i18n`Назад`,
  )

  const place = current?.target
  if (is(player.id, 'techAdmin') && place)
    f.button('§7admin: tp to quest point', () =>
      player.teleport(place.location, { dimension: world[place.dimensionType] }),
    )
})
