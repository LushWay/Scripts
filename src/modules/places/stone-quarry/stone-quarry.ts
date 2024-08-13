import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { City } from '../lib/city'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'
import { Butcher } from '../lib/npc/butcher'

class StoneQuarryBuilder extends City {
  constructor() {
    super('StoneQuarry', 'Каменоломня')
    this.create()
  }

  butcher = new Butcher(this.group)

  w = Boss.create()
    .group(this.group)
    .id('wither')
    .name('Камнедробилка')
    .typeId(MinecraftEntityTypes.Wither)
    .loot(new Loot('wither drop').item('NetherStar').build)
    .respawnTime(ms.from('hour', 1))
    .spawnEvent(true)

  commonOvener = Furnacer.create()
    .group(this.group)
    .id('ovener')
    .name('§6Печкин')
    .furnaces([
      MinecraftBlockTypes.BlastFurnace,
      MinecraftBlockTypes.LitBlastFurnace,
      MinecraftBlockTypes.Furnace,
      MinecraftBlockTypes.LitFurnace,
    ])
    .onlyInStoneQuarry(true)

  foodOvener = Furnacer.create()
    .group(this.group)
    .id('foodOvener')
    .name('§6Тетя зина')
    .furnaces([MinecraftBlockTypes.LitBlastFurnace])
    .onlyInStoneQuarry(false)

  gunsmith = new Gunsmith(this.group)

  private create() {
    this.createKits(new Loot().item('RedTerracotta').build, new Loot().item('RedTerracotta').build)
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
