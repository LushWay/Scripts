import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { DefaultPlaceWithSafeArea } from 'modules/places/lib/DefaultWithSafeArea'
import { Furnacer } from '../../features/furnacer'

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
    loot: new Loot('wither drop').item('NetherStar').build,
  })

  commonOvener = new Furnacer({
    npc: {
      id: 'ovener',
      name: '§6Печкин',
    },

    furnaceTypeIds: [
      MinecraftBlockTypes.BlastFurnace,
      MinecraftBlockTypes.LitBlastFurnace,
      MinecraftBlockTypes.Furnace,
      MinecraftBlockTypes.LitFurnace,
    ],
    onlyInStoneQuarry: true,
  })

  foodOvener = new Furnacer({
    furnaceTypeIds: [MinecraftBlockTypes.LitBlastFurnace],
    npc: {
      id: 'foodOvener',
      name: 'Едоед',
    },
    onlyInStoneQuarry: false,
  })

  constructor() {
    super('Каменоломня')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StoneQuarry = new StoneQuarryBuilder()
