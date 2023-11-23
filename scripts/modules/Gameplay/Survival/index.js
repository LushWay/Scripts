import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss } from 'modules/Gameplay/Survival/boss.js'
import { is } from 'smapi.js'
import { Region } from '../../Region/Region.js'
import { loadRegionsWithGuards } from '../../Region/index.js'
import { JOIN } from '../../Server/PlayerJoin/var.js'
import { MENU } from '../../Server/menuItem.js'
import './anarchy.js'
import { BASE_ITEM_STACK } from './base.js'
import './bouncyTnt.js'
import './fireworks.js'
import './raid.js'
import './spawn.js'

console.log('§6Gameplay mode: survival')

loadRegionsWithGuards({
  allowed(player, region, context) {
    if (player.hasTag('modding') || is(player.id, 'builder')) return true

    if (region) {
      if (region.permissions.owners.includes(player.id)) return true
    } else {
      if (
        player
          .getComponent('inventory')
          .container.getItem(player.selectedSlot)
          ?.is(BASE_ITEM_STACK)
      )
        return true

      if (context.type === 'break' && player.isGamemode('adventure'))
        return true
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

JOIN.EVENTS.firstTime.subscribe(player => {
  player.getComponent('inventory').container.addItem(MENU.item)
})

new Boss({
  name: 'wither',
  entityId: 'minecraft:' + MinecraftEntityTypes.Wither,
  displayName: 'Камнедробилка',
  bossEvent: false,

  // 1 час
  respawnTime: 1000 * 60 * 60,
})

new Boss({
  name: 'slime',
  entityId: 'minecraft:' + MinecraftEntityTypes.Slime,
  displayName: 'Слайм',

  // 10 минут
  respawnTime: 1000 * 60 * 10,
})
