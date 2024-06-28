import { City } from '../lib/city'
import { Stoner } from '../lib/npc/stoner'

class VillageOfMinersBuilder extends City {
  constructor() {
    super('VillageOfMiners', 'Деревня шахтеров')
    this.create()
  }

  private create() {
    this.createKits(
      normal => normal.item('Dirt').build,
      donut => donut.item('Dirt').build,
    )
  }

  stoner = new Stoner(this.group)
}

export const VillageOfMiners = new VillageOfMinersBuilder()
