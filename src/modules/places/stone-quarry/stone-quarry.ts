import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, util } from 'lib'
import { City } from '../lib/city'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'

class StoneQuarryBuilder extends City {
  constructor() {
    super('StoneQuarry', 'Каменоломня')
    this.create()
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

    furnaces: [
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
      name: '§6Тетя зина',
    },

    furnaces: [MinecraftBlockTypes.LitBlastFurnace],
    onlyInStoneQuarry: false,
  })

  gunsmith = new Gunsmith(this.group)

  private create() {
    this.createKits(
      normal => normal.item('RedTerracotta').build,
      donut => donut.item('RedTerracotta').build,
    )
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
