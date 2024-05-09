import { Player } from '@minecraft/server'
import { MessageForm, util } from 'lib'
import { SOUNDS } from 'lib/assets/config'
import { ActionForm } from 'lib/form/action'
import { ArrayForm } from 'lib/form/array'
import { Quest } from 'modules/Quests/lib/Quest'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
const quest = new Command('q')
  .setAliases('quest')
  .setDescription('Меню заданий')
  .setPermissions('member')
  .executes(ctx => {
    // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
    questsMenu(ctx.player)
  })

quest
  .overload('exit')
  .setDescription('Выйти')
  .executes(ctx => {
    // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
    const q = Quest.active(ctx.player)
    if (!q) return ctx.error('У вас нет активных заданий!')
    q.quest.exit(ctx.player)
    ctx.player.playSound(SOUNDS.success)
    ctx.reply('§6> §fУспешно')
  })

quest
  .overload('enter')
  .setPermissions('techAdmin')
  .executes(ctx => {
    const form = new ActionForm('Quests', 'Выбери')
    for (const [name, q] of Object.entries(Quest.list)) {
      // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
      form.addButton(name, () => {
        // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
        q.enter(ctx.player)
      })
    }
    form.show(ctx.player)
  })

/**
 * @param {Player} player
 * @param {VoidFunction} [back]
 */
export function questsMenu(player, back) {
  const { quests } = player.database
  if (!quests)
    return new MessageForm('§3Задания', '§cНет заданий')
      .setButton1(back ? ActionForm.backText : '§3Закрыть', back ?? (() => {}))
      .show(player)

  const self = () => questsMenu(player, back)

  new ArrayForm('§3Задания', !quests.active.length ? 'Нет активных заданий.' : '', quests.active, {
    filters: {},

    addCustomButtonBeforeArray(form) {
      form.addButton(util.badge('§3Завершенные задания', quests.completed.length), () =>
        completeQuestsMenu(player, self),
      )
    },
    button(dbquest) {
      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const quest = Quest.list[dbquest.id]
      if (!quest) return false

      return [
        `${quest.name}\n${quest.steps(player)?.list[dbquest.step]?.text() ?? ''}`,
        null,
        () => questMenu(player, quest, self),
      ]
    },
    back,
  }).show(player)
}

/**
 * @param {Player} player
 * @param {VoidFunction} back
 */
function completeQuestsMenu(player, back) {
  const self = () => completeQuestsMenu(player, back)

  const { quests } = player.database
  if (!quests) return

  new ArrayForm(
    'Завершенные задания',
    'Список завершенных заданий',

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    quests.completed.map(e => Quest.list[e]).filter(Boolean),
    {
      filters: {},
      button(quest, filters) {
        return [quest.name, null, () => questMenu(player, quest, self)]
      },

      back,
    },
  ).show(player)
}

/**
 * @param {Player} player
 * @param {Quest} quest
 */
function questMenu(player, quest, back = () => {}) {
  const current = quest.current(player)
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
