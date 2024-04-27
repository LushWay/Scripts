import { Player, system, world } from '@minecraft/server'
import { BaseRegion, Region, SafeAreaRegion, Settings, Sidebar } from 'lib.js'
import { emoji } from 'lib/Assets/emoji.js'
import { Minigame } from 'minigames/Builder.js'
import { Quest } from 'modules/Quests/lib/Quest.js'

const sidebarSettings = Settings.player('Боковое меню (сайдбар)', 'sidebar', {
  enabled: {
    name: 'Сайдбар',
    description: 'Определяет, включен ли сайдбар',
    value: true,
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

/**
 * @type {Record<Player['database']['inv'], string>}
 */
const inventoryDisplay = {
  anarchy: 'Анархия',
  mg: 'Миниигра',
  spawn: 'Спавн',
}

function format(n = 0) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const SURVIVAL_SIDEBAR = new Sidebar(
  {
    name: 'Server',
    getFormat: player =>
      `§l$режим§r§f$регион
§7${emoji.money} §6$монеты§7 | ${emoji.leaf} §2$листья 
§7${emoji.online} §f$онлайн§7/55

$квест`,
  },
  {
    режим: player => inventoryDisplay[player.database.inv],
    регион: player => {
      let text = ''
      if (player.database.inv === 'anarchy') {
        const region = Region.locationInRegion(player.location, player.dimension.type)
        if (region) {
          if (!region.permissions.pvp) text = ', §aмирная зона§f'
          if (region instanceof SafeAreaRegion && region.safeAreaName) text += '\n' + region.safeAreaName
          if (region instanceof BaseRegion && region.regionMember(player.id)) text = ', §6ваша база'
        }
        if (text) {
          text += '\n§r§f'
        }
      }
      return text
    },
    монеты: player => format(player.scores.money),
    листья: player => format(player.scores.leafs),
    онлайн: {
      preinit() {
        let online = world.getAllPlayers().length

        world.afterEvents.playerLeave.subscribe(() => online--)
        world.afterEvents.playerJoin.subscribe(() => online++)

        return () => online.toString()
      },
    },
    квест: Quest.sidebar,
  }
)

system.runPlayerInterval(
  player => {
    if (player.database.join) return // Do not show sidebar until player actually joins the world
    const minigame = Minigame.getCurrent(player)
    if (minigame) return minigame.sidebar.show(player)
    if (sidebarSettings(player).enabled) SURVIVAL_SIDEBAR.show(player)
    system.delay(() => player.onScreenDisplay.setTip(5, '§7158.255.5.29'))
  },
  'Survival sidebar',
  20
)
