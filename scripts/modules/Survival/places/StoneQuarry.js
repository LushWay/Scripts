import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss } from 'lib/Class/Boss.js'

new Boss({
  name: 'wither',
  entityTypeId: 'minecraft:' + MinecraftEntityTypes.Wither,
  displayName: 'Камнедробилка',
  bossEvent: false,

  // 1 час
  respawnTime: 1000 * 60 * 60,
})
