import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { Boss, LootTable, util } from 'lib.js'
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
    loot: new LootTable(
      { id: 'slime boss', fill: { type: 'itemsCount' } },
      {
        type: 'SlimeBall',
        chance: '100%',
        amount: {
          '40...64': '2%',
          '65...128': '1%',
        },
      }
    ),
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const VillageOfExplorers = new VillageOfExporersBuilder()
