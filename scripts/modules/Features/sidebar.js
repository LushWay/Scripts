import { Player, system, world } from '@minecraft/server'
import { BaseRegion, Quest, Region, SafeAreaRegion, Settings, Sidebar } from 'lib.js'
import { Minigame } from 'modules/Minigames/Builder.js'

const sidebarSettings = Settings.player('Боковое меню (сайдбар)', 'sidebar', {
  enabled: {
    name: 'Сайдбар',
    desc: 'Определяет, включен ли сайдбар',
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

const sidebar = new Sidebar(
  {
    name: 'Server',
    getFormat: player =>
      `$режим$регион
§7Монеты: §6$монеты§7 | Листья: §2$листья
§7Онлайн: §f$онлайн/55§7

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
      }
      return text
    },
    монеты: player => player.scores.money + '',
    листья: player => player.scores.leafs + '',
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
    const minigame = Minigame.getCurrent(player)
    if (minigame) return minigame.sidebar.show(player)
    if (sidebarSettings(player).enabled) sidebar.show(player)
    system.delay(() => player.onScreenDisplay.setTip(5, '§7158.255.5.29'))
  },
  'Survival sidebar',
  20
)
