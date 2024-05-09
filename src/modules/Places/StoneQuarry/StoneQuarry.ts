import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, LootTable, util } from 'lib'
import { DefaultPlaceWithSafeArea } from 'modules/Places/Default/WithSafeArea'
import { Furnacer } from '../../features/furnace'

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
    loot: new LootTable({ id: 'wither drop', fill: { type: 'itemsCount' } }, { type: 'NetherStar', chance: '100%' }),
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
      name: 'Хавка',
    },
    onlyInStoneQuarry: false,
  })

  constructor() {
    super('Каменоломня')
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StoneQuarry = new StoneQuarryBuilder()
