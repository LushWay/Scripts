import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DefaultPlaceWithSafeArea } from 'modules/Survival/utils/DefaultPlace.js'
import { Boss, util } from 'smapi.js'
import { Ovener } from '../Features/Oven'

class StoneQuarryBuilder extends DefaultPlaceWithSafeArea {
  witherBoss = new Boss({
    name: 'wither',
    displayName: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
  })

  commonOvener = new Ovener({
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

  foodOvener = new Ovener({
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
