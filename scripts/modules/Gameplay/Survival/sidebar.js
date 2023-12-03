import { world } from '@minecraft/server'
import { Quest } from 'lib/Class/Quest.js'
import { Sidebar } from 'lib/Class/Sidebar.js'
import { isBuilding } from 'modules/Gameplay/Build/list.js'
import { Settings } from 'smapi.js'

const settings = Settings.player('Боковое меню (сайдбар)', 'sidebar', {
  enabled: {
    value: true,
    name: 'Сайдбар',
    desc: 'Определяет, включен ли сайдбар',
    onChange() {
      world
        .getAllPlayers()
        .forEach(e => !settings(e).enabled && sidebar.unsubscribe(e))
    },
  },
  moneyLeafs: {
    value: true,
    name: 'Монеты и листья',
    desc: 'Определяет, включена ли строка с монетами и листьями',
  },
})

const sidebar = new Sidebar(
  { name: 'Server' },
  player => {
    if (isBuilding(player.id)) return '§fСтройка'
    else return false
  },
  player => {
    return '§7Инвентарь: ' + player.database.survival.inv
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
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  settings(player).enabled && sidebar.subscribe(player)
})

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  sidebar.unsubscribe(playerId)
})
