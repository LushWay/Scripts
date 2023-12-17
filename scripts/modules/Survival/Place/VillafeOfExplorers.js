import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss } from 'smapi.js'

new Boss({
  name: 'slime',
  entityTypeId: 'minecraft:' + MinecraftEntityTypes.Slime,
  displayName: 'Слайм',

  // 10 минут
  respawnTime: 1000 * 60 * 10,
})

class VillageOfExporersBuilder {}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfExplorers = new VillageOfExporersBuilder()
