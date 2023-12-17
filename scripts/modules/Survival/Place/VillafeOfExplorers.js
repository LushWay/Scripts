import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/Place/Default.place.js'
import { Boss, util } from 'smapi.js'

class VillageOfExporersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('VillageOfExplorers')
  }
  slimeBoss = new Boss({
    name: 'slime',
    displayName: 'Слайм',
    entityTypeId: 'minecraft:' + MinecraftEntityTypes.Slime,
    respawnTime: util.ms.from('min', 10),
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfExplorers = new VillageOfExporersBuilder()
