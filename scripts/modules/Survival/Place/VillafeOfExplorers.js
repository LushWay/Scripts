import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/utils/DefaultPlace.js'
import { Boss, util } from 'smapi.js'

class VillageOfExporersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Деревня исследователей')
  }
  slimeBoss = new Boss({
    name: 'slime',
    displayName: 'Слайм',
    entityTypeId: MinecraftEntityTypes.Slime,
    respawnTime: util.ms.from('min', 10),
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfExplorers = new VillageOfExporersBuilder()
