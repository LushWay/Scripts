import { Loot } from 'lib'
import { City } from '../lib/city'
import { Stoner } from '../lib/npc/stoner'

class VillageOfMinersBuilder extends City {
  constructor() {
    super('VillageOfMiners', 'Деревня шахтеров')
    this.create()
  }

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().item('Dirt').build)
  }

  stoner = new Stoner(this.group)
}

export const VillageOfMiners = new VillageOfMinersBuilder()
