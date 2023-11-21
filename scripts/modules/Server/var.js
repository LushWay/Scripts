import { ScoreboardDB } from 'lib/Database/Scoreboard.js'
import { GAME_UTILS, Settings, util } from 'smapi.js'

/**
 * @type {Array<"unknown" | "build" | "survival" | "disabled">}
 */
const TYPES = ['unknown', 'build', 'survival', 'disabled']

export const SERVER = {
  money: db('money', 'Монеты'),
  leafs: db('leafs', 'Листы'),
  radius: 200,
  stats: {
    blocksPlaced: db('blockPlace', 'Поставлено блок'),
    blocksBreaked: db('blockBreak', 'Сломано блоков'),
    fireworksLaunched: db('FVlaunch', 'Фв запущено'),
    fireworksExpoded: db('FVboom', 'Фв взорвано'),
    damageRecieve: db('Hget', 'Урона получено'),
    damageGive: db('Hgive', 'Урона нанесено'),
    kills: db('kills', 'Убийств'),
    deaths: db('deaths', 'Смертей'),
  },
  time: {
    anarchy: timer('anarchy', 'на анархии'),
    all: timer('all', 'всего'),
    day: timer('day', 'за день'),
  },
  options: Settings.world('server', {
    lockNether: {
      desc: 'Выключает незер',
      value: true,
      name: 'Блокировка незера',
    },
    type: {
      name: 'Тип сервера',
      value: 0,
      desc: `§eТОЛЬКО ЕСЛИ МИР ХОСТИТСЯ ИЗ МАЙНА, НА СЕРВЕРЕ ВЫСТАВЛЯЕТСЯ СКРИПТОМ\n\n§fДоступные значения:\n§f${util
        .inspect(Object.fromEntries(Object.entries(TYPES)))
        .replace('{', '')
        .replace('}', '')}`,
    },
  }),
  type: 'unknown',
}

SERVER.type =
  TYPES[
    (function getType() {
      let num = Number(GAME_UTILS.env('type'))
      if (!num || isNaN(num)) num = SERVER.options.type

      if (!(num in TYPES) || num === 0) {
        num = 0
        console[util.settings.firstLoad ? 'warn' : 'log'](
          `§cДля полноценной работы сервера используйте §f-wsettings§c, установите §fserver§c/§ftype§c и перезагрузите скрипты.`
        )
      }

      return num
    })()
  ]

/**
 *
 * @param {string} name
 * @param {string} displayName
 */
function timer(name, displayName) {
  return {
    hours: db(name + '_hours', 'Часов ' + displayName),
    minutes: db(name + '_mins', 'Минут ' + displayName),
    seconds: db(name + '_secs', 'Секунд ' + displayName),
  }
}

/**
 *
 * @param {string} id
 * @param {string} name
 * @returns
 */
function db(id, name) {
  return new ScoreboardDB(id, name)
}
