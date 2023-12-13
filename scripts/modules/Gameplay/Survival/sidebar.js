import { Player, world } from '@minecraft/server'
import { Quest } from 'lib/Class/Quest.js'
import { Sidebar } from 'lib/Class/Sidebar.js'
import { isBuilding } from 'modules/Gameplay/Build/list.js'
import { Region } from 'modules/Region/Region.js'
import { JOIN } from 'modules/Server/PlayerJoin/var.js'
import { Settings } from 'smapi.js'

const settings = Settings.player('Боковое меню (сайдбар)', 'sidebar', {
  enabled: {
    value: true,
    name: 'Сайдбар',
    desc: 'Определяет, включен ли сайдбар',
    onChange() {
      world
        .getAllPlayers()
        .forEach(e =>
          sidebar[settings(e).enabled ? 'subscribe' : 'unsubscribe'](e)
        )
    },
  },
  moneyLeafs: {
    value: true,
    name: 'Монеты и листья',
    desc: 'Определяет, включена ли строка с монетами и листьями',
  },
})

/**
 * @type {Record<Player['database']['survival']['inv'], string>}
 */
const inventoryDisplay = {
  anarchy: 'Анархия',
  mg: 'Миниигра',
  spawn: 'Спавн',
}

const sidebar = new Sidebar(
  { name: 'Server' },
  player => {
    if (isBuilding(player)) return '§fРежим стройки'
    else return false
  },
  player => {
    let text = ''
    if (player.database.survival.inv === 'anarchy') {
      const region = Region.locationInRegion(
        player.location,
        player.dimension.type
      )
      if (region) {
        if (!region.permissions.pvp) text = '§a, мирная зона'
        if (region.permissions.owners.includes(player.id))
          text = ', §6ваша база'
      }
    }
    return `§7${inventoryDisplay[player.database.survival.inv]}${text}`
  },
  player => {
    if (!settings(player).moneyLeafs) return false
    return `§7Монеты: §6${player.scores.money}§7 | Листья: §2${player.scores.leafs}`
  },
  ' ',
  Quest.sidebar,
  ' ',
  '§7shp1nat56655.portmap.io'
)

sidebar.setUpdateInterval(20)

world.getAllPlayers().forEach(e => settings(e).enabled && sidebar.subscribe(e))
JOIN.EVENTS.anyJoin.subscribe(player => {
  settings(player).enabled && sidebar.subscribe(player)
})
