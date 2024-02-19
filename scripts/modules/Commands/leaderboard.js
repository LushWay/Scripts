import { Player, Vector, world } from '@minecraft/server'
import { ActionForm, BUTTON, Leaderboard, ModalForm } from 'lib.js'

new Command({
  name: 'leaderboard',
  aliases: ['leaderboards', 'lb'],
  description: 'Управляет таблицами лидеров',
  role: 'techAdmin',
}).executes(ctx => {
  leaderboardMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
function leaderboardMenu(player) {
  const form = new ActionForm('Таблицы лидеров')
  form.addButton('§3Добавить', BUTTON['+'], editLeaderboard)

  for (const lb of Object.values(Leaderboard.all)) {
    form.addButton(info(lb), () => {
      editLeaderboard(player, lb)
    })
  }

  form.show(player)
}

/**
 * @param {Leaderboard} lb
 */
function info(lb) {
  return lb.data.displayName + '\n' + Vector.string(Vector.floor(lb.data.location))
}

/**
 *
 * @param {Player} player
 * @param {Leaderboard} [lb]
 * @param {Partial<import('lib.js').LeaderboardInfo>} data
 */
function editLeaderboard(player, lb, data = lb?.data ?? {}) {
  const action = lb ? 'Изменить ' : 'Выбрать '
  function update() {
    if (!lb && isRequired(data)) {
      lb = Leaderboard.createLeaderboard(data)
    }
    if (lb) {
      lb.update()
      lb.updateLeaderboard()
    }

    editLeaderboard(player, lb, lb ? void 0 : data)
  }

  /**
   * @param {(keyof typeof data)[]} keys
   */
  function warn(...keys) {
    if (keys.find(k => typeof data[k] === 'undefined')) return ' §e(!)'
    return ''
  }

  const form = new ActionForm('Таблица лидеров', lb ? info(lb) : '')
    .addButtonBack(() => leaderboardMenu(player))
    .addButton(action + 'целевую таблицу' + warn('displayName', 'objective'), () => {
      new ModalForm('Изменение целевой таблицы')
        .addDropdownFromObject(
          'Выбрать из списка',
          Object.fromEntries(world.scoreboard.getObjectives().map(e => [e.id, e.displayName])),
          { defaultValue: data.displayName }
        )
        // .addTextField(
        //   'Отображаемое имя',
        //   data.displayName ? 'Не изменится' : 'Имя счета по умолчанию',
        //   data.displayName
        // )
        .show(
          player,
          (
            ctx,
            id

            // displayName
          ) => {
            const scoreboard = world.scoreboard.getObjective(id)
            if (!scoreboard) return ctx.error('Скора не существует! Его удалили пока ты редактировал(а) форму хахаха')

            data.objective = id
            data.displayName = scoreboard.displayName
            if (lb) lb.scoreboard = scoreboard
            // if (!data.displayName) displayName = scoreboard.displayName
            // if (displayName) data.displayName = displayName
            update()
          }
        )
    })
    .addButton(action + 'позицию' + warn('location', 'dimension'), () => {
      /** @type {Record<import('@minecraft/server').ShortcutDimensions, string>} */
      const dimensions = { overworld: 'Верхний мир', nether: 'Нижний мир', end: 'Край' }
      new ModalForm('Позиция')
        .addTextField('Позиция', 'Не изменится', Vector.string(data.location ?? Vector.floor(player.location)))
        .addDropdownFromObject('Измерение', dimensions, {
          defaultValueIndex: Object.keys(dimensions).findIndex(e => e === player.dimension.type),
        })
        .show(player, (ctx, location, dimension) => {
          if (location) {
            const l = location.split(' ').map(Number)
            if (l.length !== 3 || l.find(isNaN))
              return ctx.error("Неверная локация '" + location + "', ожидался формат 'x y z' с числами")

            const [x, y, z] = l
            data.location = { x, y, z }
          }
          data.dimension = dimension
          if (lb && data.location) lb.entity.teleport(data.location, { dimension: world[dimension] })
          update()
        })
    })
    .addButton(action + 'стиль' + warn('style'), () => {
      /** @type {Record<keyof (typeof Leaderboard)['styles'], string>} */
      const styles = {
        gray: '§7Серый',
        white: '§fБелый',
        green: '§2Зеленый',
      }
      new ModalForm('Стиль')
        .addDropdownFromObject('Стиль', styles, {
          defaultValueIndex: data.style ? Object.keys(styles).findIndex(v => v === data.style) : void 0,
        })
        .show(player, (ctx, style) => {
          data.style = style
          update()
        })
    })

  if (lb) form.addButtonPrompt('§cУдалить таблицу лидеров', '§cУдалить', () => lb && lb.remove(), 'Отмена')

  form.show(player)
}

/**
 * @param {Partial<import('lib.js').LeaderboardInfo>} data
 * @returns {data is import('lib.js').LeaderboardInfo}
 */
function isRequired(data) {
  return !!data.dimension && !!data.displayName && !!data.location && !!data.objective && !!data.style
}
