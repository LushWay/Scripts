import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss } from 'lib/Class/Boss.js'

new Boss({
  name: 'slime',
  entityTypeId: 'minecraft:' + MinecraftEntityTypes.Slime,
  displayName: 'Слайм',

  // 10 минут
  respawnTime: 1000 * 60 * 10,
})
