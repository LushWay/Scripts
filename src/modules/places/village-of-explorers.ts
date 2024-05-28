import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'

class VillageOfExporersBuilder extends DefaultPlaceWithSafeArea {
  constructor() {
    super('Деревня исследователей')
  }

  slimeBoss = new Boss({
    name: 'slime',
    displayName: 'Слайм',
    entityTypeId: MinecraftEntityTypes.Slime,
    respawnTime: util.ms.from('min', 10),
    loot: new Loot('slime boss').item('SlimeBall').amount({
      '40...64': '2%',
      '65...128': '1%',
    }).build,
  })
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
