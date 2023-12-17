import { Player } from '@minecraft/server'
import { Region } from 'lib/Region/Region.js'
import { loadRegionsWithGuards } from 'lib/Region/index.js'
import { isBuilding } from 'modules/Build/list.js'
import { Join } from 'modules/PlayerJoin/playerJoin.js'
import { Menu } from 'modules/Server/menuItem.js'
import { ActionForm, EventSignal } from 'smapi.js'

import './features/base.js'
import './features/baseMenu.js'
import './features/explosibleFireworks.js'
import './features/fireballAndIceBomb.js'
import './features/raid.js'
import './features/randomTeleport.js'
import './features/sidebar.js'
import './features/throwableTnt.js'

import { ANARCHY } from './Place/Anarchy.js'
import './Place/Mineshaft.js'
import { SPAWN } from './Place/Spawn.js'
import './Place/StoneQuarry.js'
import './Place/TechCity.js'
import './Place/VillafeOfExplorers.js'
import './Place/VillageOfMiners.js'
import './quests/index.js'

console.log('§6Gameplay mode: survival')

/**
 * @type {EventSignal<Parameters<import('lib/Region/index.js').interactionAllowed>, boolean | undefined, import('lib/Region/index.js').interactionAllowed>}
 */
export const INTERACTION_GUARD = new EventSignal()

INTERACTION_GUARD.subscribe(player => {
  if (isBuilding(player)) return true
}, 100)

INTERACTION_GUARD.subscribe((player, region) => {
  if (region?.regionMember(player.id)) return true
}, -100)

loadRegionsWithGuards({
  allowed(player, region, context) {
    for (const [fn] of EventSignal.sortSubscribers(INTERACTION_GUARD)) {
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

Join.config.title_animation = {
  stages: ['» $title «', '»  $title  «'],
  vars: {
    title: '§aShp1nat§6Mine§r§f',
  },
}
Join.config.subtitle = 'Добро пожаловать!'

/**
 * @param {Player['database']['survival']['inv']} place
 * @param {Player['database']['survival']['inv']} inv
 */
function placeButton(place, inv, color = '§9', text = 'Спавн') {
  return `${inv === place ? '§7Вы тут ' : color}> ${inv === place ? '§8' : '§f'}${text}`
}

Menu.open = player => {
  const inv = player.database.survival.inv
  return new ActionForm('§aShp1nat§6Mine')
    .addButton(placeButton('spawn', inv, '§9', 'Спавн'), () => {
      SPAWN.portal?.teleport(player)
    })
    .addButton(placeButton('anarchy', inv, '§c', 'Анархия'), () => {
      ANARCHY.portal?.teleport(player)
    })
    .addButton(placeButton('mg', inv, `§6`, `Миниигры\n§7СКОРО!`), () => {
      const form = Menu.open(player)
      if (form) form.show(player)
    })
}

Join.onMoveAfterJoin.subscribe(({ player, firstJoin }) => {
  if (firstJoin) player.getComponent('inventory').container.addItem(Menu.item)
})
