import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { PlaceWithSafeArea } from 'modules/places/lib/place-with-safearea'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'

class StoneQuarryBuilder extends PlaceWithSafeArea {
  constructor() {
    super('StoneQuarry', 'Каменоломня')
  }

  witherBoss = new Boss({
    group: this.group,
    id: 'wither',
    name: 'Камнедробилка',
    entityTypeId: MinecraftEntityTypes.Wither,
    bossEvent: false,
    respawnTime: util.ms.from('hour', 1),
    loot: new Loot('wither drop').item('NetherStar').build,
  })

  commonOvener = new Furnacer({
    npc: {
      group: this.group,
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
    npc: {
      group: this.group,
      id: 'foodOvener',
      name: '§6Пекарь',
    },

    furnaceTypeIds: [MinecraftBlockTypes.LitBlastFurnace],
    onlyInStoneQuarry: false,
  })

  gunsmith = new Gunsmith(this.group)
}

export const StoneQuarry = new StoneQuarryBuilder()
