import { Player } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { isBuilding } from 'modules/Gameplay/Build/list.js'
import { Boss } from 'modules/Gameplay/Survival/boss.js'
import { MENU } from 'modules/Server/menuItem.js'
import { ActionForm, EventSignal } from 'smapi.js'
import { Region } from '../../Region/Region.js'
import { loadRegionsWithGuards } from '../../Region/index.js'
import { JOIN } from '../../Server/PlayerJoin/var.js'
import { ANARCHY } from './anarchy.js'
import './base.js'
import './customItems.js'
import './quests/index.js'
import './raid.js'
import './sidebar.js'
import { SPAWN } from './spawn.js'

console.log('§6Gameplay mode: survival')

/**
 * @type {EventSignal<Parameters<import('modules/Region/index.js').interactionAllowed>, boolean | undefined, import('modules/Region/index.js').interactionAllowed>}
 */
export const SURVIVAL_INTERACTION = new EventSignal()

SURVIVAL_INTERACTION.subscribe(player => {
  if (isBuilding(player)) return true
}, 100)

SURVIVAL_INTERACTION.subscribe((player, region) => {
  if (region?.regionMember(player.id)) return true
}, -100)

loadRegionsWithGuards({
  allowed(player, region, context) {
    for (const [fn] of EventSignal.sortSubscribers(SURVIVAL_INTERACTION)) {
      const result = fn(player, region, context)
      if (typeof result !== 'undefined') return result
    }
  },

  spawnAllowed(region, data) {
    return (
      !region ||
      region.permissions.allowedEntities === 'all' ||
      region.permissions.allowedEntities.includes(data.entity.typeId)
    )
  },

  regionCallback(player, currentRegion) {
    if (currentRegion && !currentRegion?.permissions.pvp) {
      player.triggerEvent('player:spawn')
    }
  },
})

Region.config.permissions = {
  allowedEntities: 'all',
  doorsAndSwitches: false,
  openContainers: false,
  owners: [],
  pvp: true,
}

JOIN.CONFIG.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§aShp1nat§6Mine§r§f',
  },
}
JOIN.CONFIG.subtitle = 'Добро пожаловать!'

/**
 * @param {Player['database']['survival']['inv']} place
 * @param {Player['database']['survival']['inv']} inv
 */
function placeButton(place, inv, color = '§9', text = 'Спавн') {
  return `${inv === place ? '§7Вы тут ' : color}> ${
    inv === place ? '§8' : '§f'
  }${text}`
}

MENU.OnOpen = player => {
  const inv = player.database.survival.inv
  return new ActionForm('§aShp1nat§6Mine')
    .addButton(placeButton('spawn', inv, '§9', 'Спавн'), () => {
      SPAWN.portal?.teleport(player)
    })
    .addButton(placeButton('anarchy', inv, '§c', 'Анархия'), () => {
      ANARCHY.portal?.teleport(player)
    })
    .addButton(placeButton('mg', inv, `§6`, `Миниигры\n§7СКОРО!`), () => {
      const form = MENU.OnOpen(player)
      if (form) form.show(player)
    })
}

// JOIN.EVENTS.firstTime.subscribe(player => {
//   player.getComponent('inventory').container.addItem(MENU.item)
// })

new Boss({
  name: 'wither',
  entityTypeId: 'minecraft:' + MinecraftEntityTypes.Wither,
  displayName: 'Камнедробилка',
  bossEvent: false,

  // 1 час
  respawnTime: 1000 * 60 * 60,
})

new Boss({
  name: 'slime',
  entityTypeId: 'minecraft:' + MinecraftEntityTypes.Slime,
  displayName: 'Слайм',

  // 10 минут
  respawnTime: 1000 * 60 * 10,
})
