/* i18n-ignore */

import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { BUTTON } from 'lib/form/utils'
import { Leaderboard, LeaderboardInfo } from 'lib/rpg/leaderboard'
import { Vec } from 'lib/vector'

new Command('leaderboard')
  .setAliases('leaderboards', 'lb')
  .setDescription('Управляет таблицами лидеров')
  .setPermissions('techAdmin')
  .executes(ctx => {
    leaderboardMenu(ctx.player)
  })

function leaderboardMenu(player: Player) {
  const form = new ActionForm('Таблицы лидеров')

  form.button('§3Добавить', BUTTON['+'], p => editLeaderboard(p))

  for (const lb of Leaderboard.all.values()) {
    form.button(info(lb), () => {
      editLeaderboard(player, lb)
    })
  }

  form.show(player)
}

function info(lb: Leaderboard) {
  return lb.info.displayName + '\n' + Vec.string(Vec.floor(lb.info.location))
}

function editLeaderboard(player: Player, lb?: Leaderboard, data: Partial<LeaderboardInfo> = lb?.info ?? {}) {
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

  function warn(...keys: (keyof typeof data)[]) {
    if (keys.find(k => typeof data[k] === 'undefined')) return ' §e(!)'
    return ''
  }

  const form = new ActionForm('Таблица лидеров', lb ? info(lb) : '')
    .addButtonBack(() => leaderboardMenu(player), player.lang)
    .button(action + 'целевую таблицу' + warn('displayName', 'objective'), () => {
      new ModalForm('Изменение целевой таблицы')
        .addDropdownFromObject(
          'Выбрать из списка',
          Object.fromEntries(world.scoreboard.getObjectives().map(e => [e.id, e.displayName])),
          { defaultValue: data.displayName },
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
            id,

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
          },
        )
    })
    .button(action + 'позицию' + warn('location', 'dimension'), () => {
      const dimensions: Record<import('@minecraft/server').ShortcutDimensions, string> = {
        overworld: 'Верхний мир',
        nether: 'Нижний мир',
        end: 'Край',
      }
      new ModalForm('Позиция')
        .addTextField('Позиция', 'Не изменится', Vec.string(data.location ?? Vec.floor(player.location)))
        .addDropdownFromObject('Измерение', dimensions, {
          defaultValueIndex: Object.keys(dimensions).findIndex(e => e === player.dimension.type),
        })
        .show(player, (ctx, location, dimension) => {
          if (location) {
            const l = location.split(' ').map(Number)
            if (l.length !== 3 || l.find(isNaN))
              return ctx.error("Неверная локация '" + location + "', ожидался формат 'x y z' с числами")

            const [x, y, z] = l as [number, number, number]
            data.location = { x, y, z }
          }
          data.dimension = dimension
          update()
        })
    })
    .button(action + 'стиль' + warn('style'), () => {
      const styles: Record<keyof (typeof Leaderboard)['styles'], string> = {
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

  if (lb) {
    form.button('Переместить к себе', () => {
      data.location = Vec.floor(player.location).add(Vec.one.multiply(0.5))
      data.dimension = player.dimension.type
      update()
    })
    form.ask('§cУдалить таблицу лидеров', '§cУдалить', () => lb && lb.remove(), 'Отмена')
  }

  form.show(player)
}

function isRequired(data: Partial<LeaderboardInfo>): data is LeaderboardInfo {
  return !!data.dimension && !!data.displayName && !!data.location && !!data.objective && !!data.style
}
