import { Player, system, TicksPerSecond, world } from '@minecraft/server'
import { Menu, Region, separateNumberWithDots, Settings, Sidebar } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Quest } from 'lib/quest/quest'
import { t } from 'lib/text'
import { Minigame } from 'modules/minigames/Builder'
import { BaseRegion } from 'modules/places/base/region'

const getSidebarSettings = Settings.player(...Menu.settings, {
  enabled: {
    name: t`Использовать меню`,
    description: t`Определяет, включено ли внутриигровое меню`,
    value: true,
  },
  sidebarMaxWordLength: {
    name: t`Максимальный размер бокового меню`,
    description: t`Максимально допустимое кол-во символов, при достижении которого слова будут переноситься`,
    value: 20,
  },
  mode: {
    name: t`Режим отображения`,
    description: t`Определяет, где будет меню`,
    value: [
      ['tips', t`Разделенные подсказки`],
      ['sidebar', t`Боковое меню`],
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

const inventoryDisplay: Record<Player['database']['inv'], string> = {
  anarchy: t`Анархия`,
  mg: t`Миниигра`,
  spawn: t`Спавн`,
}

const names = {
  mode: t`режим`,
  region: t`регион`,
  money: t`монеты`,
  leafs: t`листья`,
  online: t`онлайн`,
  quest: t`квест`,
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
      const base = '§l' + inventoryDisplay[player.database.inv] + '§r§f'
      let text = base
      if (player.database.inv === 'anarchy') {
        if (region) {
          text = ''
          if (!region.permissions.pvp) text = t`§aМирная зона§f `
          const { displayName } = region
          if (displayName) text += displayName
          if (region instanceof BaseRegion) {
            if (region.getMemberRole(player.id)) {
              return region.baseMemberText()
            } else text = base
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
