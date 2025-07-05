import { Player, system, TicksPerSecond, world } from '@minecraft/server'
import { Menu, Region, separateNumberWithDots, Settings, Sidebar } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { i18n } from 'lib/i18n/text'
import { Quest } from 'lib/quest/quest'
import { Minigame } from 'modules/minigames/Builder'
import { BaseRegion } from 'modules/places/base/region'

const getSidebarSettings = Settings.player(...Menu.settings, {
  enabled: {
    name: i18n`Использовать меню`,
    description: i18n`Определяет, включено ли внутриигровое меню`,
    value: true,
  },
  sidebarMaxWordLength: {
    name: i18n`Максимальный размер бокового меню`,
    description: i18n`Максимально допустимое кол-во символов, при достижении которого слова будут переноситься`,
    value: 20,
  },
  mode: {
    name: i18n`Режим отображения`,
    description: i18n`Определяет, где будет меню`,
    value: [
      ['tips', i18n`Разделенные подсказки`],
      ['sidebar', i18n`Боковое меню`],
    ],
  },
  //   format: {
  //     name: 'Формат сайдбара',
  //     desc: `Переменные:
  // $режим - Анархия / Спавн / Миниигры
  // $регион - ', мирная зона' / ', ваша база' / <имя безопасной зоны>
  // $монеты - число монет
  // $листья - число листьев
  // $онлайн - всего игроков на сервере
  // $квест - информация о квесте`,
  //     value: `$режим$регион
  // §7Монеты: §6$монеты§7 | Листья: §2$листья
  // §7Онлайн: §f$онлайн/55§7

  // $квест`,
  //   },
})

const inventoryDisplay: Record<Player['database']['inv'], Text> = {
  anarchy: i18n`Анархия`,
  mg: i18n`Миниигра`,
  spawn: i18n`Спавн`,
}

const names = {
  mode: 'mode',
  region: 'region',
  money: 'money',
  leafs: 'leafs',
  online: 'online',
  quest: 'quest',
}

// $режим§l§7$регион

const survivalSidebar = new Sidebar(
  {
    name: 'Server',
    getExtra: player => getSidebarSettings(player),

    getOptions(player, settings) {
      const region = `$${names.region}`

      const scores = `§6$${names.money}${emoji.money} §2$${names.leafs}${emoji.leaf}`
      const online = `§f$${names.online}§7/55${emoji.online}`
      const stats = `${scores} ${online}${settings.mode === 'sidebar' ? '\n \n' : ''}`

      return {
        format:
          settings.mode === 'sidebar'
            ? `${region}\n${stats}\n$${names.quest}`
            : [stats, undefined, `$${names.quest}`, undefined, region],

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        maxWordCount: settings.sidebarMaxWordLength ?? 20,
      }
    },
  },
  {
    [names.region]: (player, settings) => {
      const regions = Region.getManyAt(player)
      const region = regions[0] as Region | undefined
      const base = '§l' + inventoryDisplay[player.database.inv].to(player.lang) + '§r§f'
      let text = base
      if (player.database.inv === 'anarchy') {
        if (region instanceof BaseRegion) {
          if (region.getMemberRole(player.id)) text = region.baseMemberText(player)
        } else if (region) {
          text = ''
          const displayName = region.displayName?.to(player.lang)
          if (displayName) {
            switch (region.permissions.pvp) {
              case true:
                text = displayName
                break
              case 'pve':
                text = `${emoji.shield.yellow} ${displayName}`
                break
              case false:
                text = `${emoji.shield.green} ${displayName}`
            }
          }
        }
      }

      if (settings.mode === 'sidebar') text += '\n§r§f'

      return text
    },
    [names.money]: player => separateNumberWithDots(player.scores.money),
    [names.leafs]: player => separateNumberWithDots(player.scores.leafs),
    [names.online]: {
      create() {
        const actual = () => world.getAllPlayers().length
        let online = actual()
        system.runTimeout(() => (online = actual()), 'actual online', TicksPerSecond * 60 * 20)

        world.afterEvents.playerLeave.subscribe(() => online--)
        world.afterEvents.playerJoin.subscribe(() => online++)

        return () => online.toString()
      },
    },
    [names.quest]: Quest.sidebar,
  },
)

export function showSurvivalHud(player: Player) {
  survivalSidebar.show(player)
}

system.runPlayerInterval(
  player => {
    if (player.database.join) return // Do not show sidebar until player actually joins the world

    const settings = getSidebarSettings(player)

    if (!settings.enabled) return

    const minigame = Minigame.getCurrent(player)
    if (minigame) {
      minigame.showHud(player)
    } else {
      showSurvivalHud(player)
    }
  },
  'Survival sidebar',
  10,
)
