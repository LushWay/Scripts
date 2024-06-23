import { util } from 'lib'
import { DungeonRegion } from 'lib/region/kinds/DungeonRegion'
import { CannonBulletItem } from '../tech-city/engineer'

export class GasStationRegion extends DungeonRegion {
  static kind = 'gas_station'

  protected structureId = 'mystructure:dungeons/gas_station'

  protected structurePosition = { x: 0, y: 0, z: 0 }

  protected configureDungeon() {
    this.createChest(
      { x: 0, y: 0, z: 0 },
      loot =>
        loot
          .itemStack(CannonBulletItem.blueprint)
          .chance('10%')

          .item('Apple')
          .chance('50%')

          .item('String')
          .chance('30%')

          .item('Web')
          .chance('40%').build,
    ).restoreTime(util.ms.from('min', 1))
  }
}
