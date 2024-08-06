import { Loot, Region, ms, registerRegionKind } from 'lib'
import { CustomStructures } from 'lib/assets/config'
import { DungeonRegion } from 'lib/region/kinds/dungeon'
import { CannonBulletItem } from 'modules/features/cannon'

export class GasStationGarageRegion extends DungeonRegion {
  static kind = 'gas_station_garage'

  protected structureId = CustomStructures.GasStationGarage as string

  protected structureSize = { x: 19, y: 12, z: 27 }

  protected configureDungeon() {
    const loot = new Loot()
      .itemStack(CannonBulletItem.blueprint)
      .chance('10%')

      .item('Apple')
      .chance('50%')

      .item('String')
      .chance('30%')
      .amount({
        '10...20': '10%',
        '21...30': '20%',
      })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' }).build

    this.createChest({ x: 0, y: 0, z: 0 }, loot).restoreTime(ms.from('sec', 10))
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get displayName() {
    return 'Гараж'
  }
}
registerRegionKind(GasStationGarageRegion as typeof Region)

export class GasStationCommonRegion extends DungeonRegion {
  static kind = 'gas_station'

  protected structureId = 'dungeon/gas_station'

  protected structureSize = { x: 17, y: 13, z: 18 }

  protected configureDungeon(): void {
    const loot = new Loot()
      .itemStack(CannonBulletItem.blueprint)
      .chance('10%')

      .item('String')
      .chance('30%')
      .amount({
        '10...20': '10%',
        '21...30': '20%',
      })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' }).build

    this.createChest({ x: 0, y: -1, z: 0 }, loot).restoreTime(ms.from('sec', 10))
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get displayName() {
    return 'Заправка'
  }
}
registerRegionKind(GasStationCommonRegion as typeof Region)

export class GasStationRegion extends DungeonRegion {
  static kind = 'gas_station'

  protected structureId = 'dungeon/gas_station'

  protected structureSize = { x: 0, y: 0, z: 0 }

  protected configureDungeon(): void {
    const loot = new Loot()
      .itemStack(CannonBulletItem.blueprint)
      .chance('10%')

      .item('String')
      .chance('30%')
      .amount({
        '10...20': '10%',
        '21...30': '20%',
      })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' })

      .item('Web')
      .chance('40%')
      .amount({ '1...2': '1%' }).build

    this.createChest({ x: 0, y: -1, z: 0 }, loot).restoreTime(ms.from('sec', 10))
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get displayName() {
    return 'Заправка'
  }
}
registerRegionKind(GasStationRegion as typeof Region)
