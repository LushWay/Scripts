import { system } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { Boss, Loot, ms } from 'lib'
import { AuntZina } from 'modules/places/stone-quarry/aunt-zina'
import { Barman } from 'modules/places/stone-quarry/barman'
import { Horseman } from 'modules/places/stone-quarry/horseman'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'

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
    this.w.location.onLoad.subscribe(() => {
      if (this.w.region) this.w.region.permissions.allowedEntities = 'all'
    })

    system.runInterval(
      () => {
        if (!this.w.region) return
        if (!this.w.entity) return
        if (!this.w.region.area.isVectorIn(this.w.entity.location, this.w.region.dimensionId)) {
          this.w.entity.teleport(this.w.region.area.center)
        }
      },
      'asdasda',
      40,
    )

    this.createKits(new Loot().item('RedTerracotta').build, new Loot().item('RedTerracotta').build)
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
