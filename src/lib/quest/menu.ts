import { Player, world } from '@minecraft/server'
import { EventSignal } from 'lib/event-signal'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { MessageForm } from 'lib/form/message'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { i18n, noI18n, textTable } from 'lib/i18n/text'
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

export const manageQuestMenu = form.params<{ quest: Quest; target?: Player }>(
  (f, { player, back, params: { quest, target = player } }) => {
    const current = quest.getCurrentStep(target)
    const description: Text.Table = [[i18n`Описание`, quest.description]]
    if (current) {
      description.push([i18n`Текущее действие`, current.text()], [i18n`Описание:`, current.description?.()], '')

      if (current.target) {
        description.push([i18n`Локация`, Vec.string(current.target.location, true)])
        if (current.target.dimensionType !== 'overworld')
          description.push([i18n`Измерение`, current.target.dimensionType])
      }
    } else if (quest.isCompleted(target)) {
      description.push(i18n.success`Задание завершено!`)
    }

    f.title(quest.name)
    f.body(textTable(description))

    if (Quest.getCurrentStepOf(target) !== current) {
      f.button(i18n`Сделать приоритетным`, () => {
        if (!target.database.quests) return

        const active = quest.getDatabase(target)
        if (!active) return

        target.database.quests.active = target.database.quests.active.filter(e => e !== active)
        target.database.quests.active.unshift(active)
      })
    }

    f.ask(
      i18n.error`Отказаться`,
      i18n.error`Отказаться от задания?`,
      () => (quest.exit(target, undefined, true), back?.(player)),
      i18n`Назад`,
    )

    if (is(player.id, 'techAdmin')) {
      const place = current?.target
      if (place) {
        f.button(noI18n.accent`admin: tp to quest point`, () =>
          player.teleport(place.location, { dimension: world[place.dimensionType] }),
        )
      }
      if (current) {
        f.button(noI18n.accent`admin: move steps`, () => {
          new ModalForm('steps').addTextField('steps, -1 - back, 1 - forward', '1', '1').show(player, (ctx, v) => {
            if (isNaN(parseInt(v))) return ctx.error('Not a number')
            const i = quest.getDatabase(player)?.i
            if (typeof i === 'undefined') return ctx.error('Not in quest')

            player.success(
              noI18n`Quest move: ${i} -> ${i + parseInt(v)}/${quest.getCurrentStep(player)?.playerQuest.steps.length}`,
            )
            quest.setStep(player, i + parseInt(v))
          })
        })
      } else {
        f.button(noI18n.accent`admin: enter`, () => {
          quest.enter(player)
        })
      }
    }
  },
)
