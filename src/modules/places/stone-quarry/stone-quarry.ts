import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Loot } from 'lib'
import { AuntZina } from 'modules/places/stone-quarry/aunt-zina'
import { Barman } from 'modules/places/stone-quarry/barman'
import { Horseman } from 'modules/places/stone-quarry/horseman'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'
import { createBossWither } from './wither.boss'

class StoneQuarryBuilder extends City {
  constructor() {
    super('StoneQuarry', 'Каменоломня')
    this.create()
  }

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  auntzine = new AuntZina(this.group)

  barman = new Barman(this.group)

  coachman = new Horseman(this.group)

  stoner = new Stoner(this.group)

  wither = createBossWither(this.group)

  commonOvener = Furnacer.create()
    .group(this.group)
    .id('ovener')
    .name('§6Печкин')
    .furnaceTypeIds([
      MinecraftBlockTypes.BlastFurnace,
      MinecraftBlockTypes.LitBlastFurnace,
      MinecraftBlockTypes.Furnace,
      MinecraftBlockTypes.LitFurnace,
    ])
    .onlyInStoneQuarry(true)

  foodOvener = Furnacer.create()
    .group(this.group)
    .id('foodOvener')
    .name('§6Баба валя')
    .furnaceTypeIds([MinecraftBlockTypes.LitBlastFurnace])
    .onlyInStoneQuarry(false)

  gunsmith = new Gunsmith(this.group)

  private create() {
    this.createKits(new Loot().item('RedTerracotta').build, new Loot().item('RedTerracotta').build)
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
