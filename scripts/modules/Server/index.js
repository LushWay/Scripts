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
  radius = 200
  stats = {
    blocksPlaced: db('blockPlace', 'Блоков поставлено'),
    blocksBreaked: db('blockBreak', 'Блоков сломано'),
    fireworksLaunched: db('FVlaunch', 'Фейерверков запущено'),
    fireworksExpoded: db('FVboom', 'Фейерверков взорвано'),
    damageRecieve: db('Hget', 'Урона получено'),
    damageGive: db('Hgive', 'Урона нанесено'),
    kills: db('kills', 'Убийств'),
    deaths: db('deaths', 'Смертей'),
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
    SM.afterEvents.modulesLoad.subscribe(() => {
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

      let toImport = ''
      if (this.type === 'build') toImport = '../Build/index.js'
      if (this.type === 'survival') toImport = '../Survival/index.js'

      if (toImport)
        importModules({
          array: [toImport],
          fn: m => import(m),
          deleteStack: 1,
        })
    })
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Server = new ServerBuilder()
