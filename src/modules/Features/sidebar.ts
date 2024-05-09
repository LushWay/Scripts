import { Player, system, world } from '@minecraft/server'
import { BaseRegion, Menu, MineshaftRegion, Region, SafeAreaRegion, Settings, Sidebar, util } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Minigame } from 'modules/Minigames/Builder'
import { Quest } from 'modules/Quests/lib/Quest'

// @ts-expect-error TS(2556) FIXME: A spread argument must either have a tuple type or... Remove this comment to see the full error message
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

/** @type {Record<Player['database']['inv'], string>} */
const inventoryDisplay = {
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
      const main = `§l$${names.mode}§r§f$${names.region}`

      const scores = `§6$${names.money}${emoji.money} §2$${names.leafs}${emoji.leaf}`
      const online = `${emoji.online} §f$${names.online}§7/55`
      const second = `${scores}\n${online}${settings?.mode === 'sidebar' ? '\n \n' : ''}`

      return {
        format:
          settings?.mode === 'sidebar'
            ? `${main}\n${second}\n$${names.quest}`
            : [main, second, `$${names.quest}`, undefined, undefined],

        maxWordCount: settings?.sidebarMaxWordLength ?? 20,
      }
    },
  },
  {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    [names.mode]: player => inventoryDisplay[player.database.inv],
    [names.region]: (player, settings) => {
      let text = ''
      if (player.database.inv === 'anarchy') {
        const region = Region.locationInRegion(player.location, player.dimension.type)
        if (region) {
          // @ts-expect-error TS(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message
          if (!region.permissions.pvp) text = ' §aмирная зона§f'

          // @ts-expect-error TS(2358) FIXME: The left-hand side of an 'instanceof' expression m... Remove this comment to see the full error message
          if (region instanceof SafeAreaRegion && region.safeAreaName) text += ' ' + region.safeAreaName

          // @ts-expect-error TS(2358) FIXME: The left-hand side of an 'instanceof' expression m... Remove this comment to see the full error message
          if (region instanceof MineshaftRegion) text += ' шахта'

          // @ts-expect-error TS(2358) FIXME: The left-hand side of an 'instanceof' expression m... Remove this comment to see the full error message
          if (region instanceof BaseRegion && region.getMemberRole(player.id)) text = ' §6ваша база'
        }
      }

      if (settings.mode === 'sidebar') text += '\n§r§f'

      return text
    },
    [names.money]: player => util.numseparate(player.scores.money),
    [names.leafs]: player => util.numseparate(player.scores.leafs),
    [names.online]: {
      init() {
        let online = world.getAllPlayers().length

        world.afterEvents.playerLeave.subscribe(() => online--)
        world.afterEvents.playerJoin.subscribe(() => online++)

        return () => online.toString()
      },
    },
    [names.quest]: Quest.sidebar,
  },
)

/** @param {Player} player */
export function showSurvivalHud(player) {
  survivalSidebar.show(player)
}

system.runPlayerInterval(
  player => {
    if (player.database.join) return // Do not show sidebar until player actually joins the world

    const settings = getSidebarSettings(player)

    if (!settings.enabled) return

    const minigame = Minigame.getCurrent(player)
    if (minigame) {
      // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
      minigame.showHud(player)
    } else {
      showSurvivalHud(player)
    }
  },
  'Survival sidebar',
  20,
)
