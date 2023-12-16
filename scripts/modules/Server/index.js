import { ScoreboardDB } from 'lib/Database/Scoreboard.js'
import importModules from 'modules/importModules.js'
import { GAME_UTILS, Settings, util } from 'smapi.js'

/**
 * @type {Array<"unknown" | "build" | "survival" | "disabled">}
 */
const TYPES = ['unknown', 'build', 'survival', 'disabled']

/** @type {(id: string, name: string) => ScoreboardDB} */
const db = (id, name) => new ScoreboardDB(id, name)

class ServerBuilder {
  money = db('money', 'Монеты')
  leafs = db('leafs', 'Листы')
  radius = 200
  stats = {
    blocksPlaced: db('blockPlace', 'Поставлено блок'),
    blocksBreaked: db('blockBreak', 'Сломано блоков'),
    fireworksLaunched: db('FVlaunch', 'Фв запущено'),
    fireworksExpoded: db('FVboom', 'Фв взорвано'),
    damageRecieve: db('Hget', 'Урона получено'),
    damageGive: db('Hgive', 'Урона нанесено'),
    kills: db('kills', 'Убийств'),
    deaths: db('deaths', 'Смертей'),
  }
  time = {
    anarchy: timer('anarchy', 'на анархии'),
    all: timer('all', 'всего'),
    day: timer('day', 'за день'),
  }
  options = Settings.world('server', {
    type: {
      name: 'Тип сервера',
      value: 0,
      desc: `§eТОЛЬКО ЕСЛИ МИР ХОСТИТСЯ ИЗ МАЙНА, НА BDS ВЫСТАВЛЯЕТСЯ СКРИПТОМ\n\n§fДоступные значения:\n§f${util
        .inspect(Object.fromEntries(Object.entries(TYPES)))
        .replace('{', '')
        .replace('}', '')}`,
    },
  })
  type = 'unknown'
  constructor() {
    this.type =
      TYPES[
        (() => {
          let num = Number(GAME_UTILS.env('type'))
          if (!num || isNaN(num)) num = this.options.type

          if (!(num in TYPES) || num === 0) {
            num = 0
            console[util.settings.firstLoad ? 'warn' : 'log'](
              `§cДля полноценной работы сервера используйте §f-wsettings§c, установите §fserver§c/§ftype§c и перезагрузите скрипты.`
            )
          }

          return num
        })()
      ]
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Server = new ServerBuilder()

let toImport = './disabled.js'
if (Server.type === 'build') toImport = '../Build/index.js'
if (Server.type === 'survival') toImport = '../Survival/config.js'

importModules({
  array: [toImport],
  fn: m => import(m),
})

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
