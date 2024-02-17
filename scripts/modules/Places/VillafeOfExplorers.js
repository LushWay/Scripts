import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss, util } from 'lib.js'
import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea.js'

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
