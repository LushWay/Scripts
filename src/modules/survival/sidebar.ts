import { Player, system, world } from '@minecraft/server'
import { BaseRegion, Menu, MineshaftRegion, Region, SafeAreaRegion, Settings, Sidebar, util } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Quest } from 'lib/quest/quest'
import { Minigame } from 'modules/minigames/Builder'

const getSidebarSettings = Settings.player(...Menu.settings, {
  enabled: {
    name: 'Использовать меню',
    description: 'Определяет, включено ли внутриигровое меню',
    value: true,
  },
  sidebarMaxWordLength: {
    name: 'Максимальный размер бокового меню',
    description: 'Максимально допустимое кол-во символов, при достижении которого слова будут переноситься',
    value: 20,
  },
  mode: {
    name: 'Режим отображения',
    description: 'Определяет, где будет меню',
    value: [
      ['tips', 'Разделенные подсказки'],
      ['sidebar', 'Боковое меню'],
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
  anarchy: 'Анархия',
  mg: 'Миниигра',
  spawn: 'Спавн',
}

const names = {
  mode: 'режим',
  region: 'регион',
  money: 'монеты',
  leafs: 'листья',
  online: 'онлайн',
  quest: 'квест',
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
      const regions = Region.nearestRegions(player.location, player.dimension.type)
      const region = regions[0] as Region | undefined
      let text = '§l' + inventoryDisplay[player.database.inv] + '§r§f'
      if (player.database.inv === 'anarchy') {
        if (region) {
          //
          text = ''
          if (regions.find(e => !e.permissions.pvp)) text = '§aМирная зона§f '
          if (region.displayName) text += region.displayName
          if (region instanceof MineshaftRegion) text += '§7Шахта'
          if (region instanceof BaseRegion && region.getMemberRole(player.id)) text = '§6Ваша база'
        }
      }

      if (settings.mode === 'sidebar') text += '\n§r§f'

      return text
    },
    [names.money]: player => util.numseparate(player.scores.money),
    [names.leafs]: player => util.numseparate(player.scores.leafs),
    [names.online]: {
      create() {
        let online = world.getAllPlayers().length

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
  20,
)
