import { Loot, LootTable } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { StructureDungeonsId } from 'lib/assets/structures'
import { CannonBulletItem } from 'modules/features/cannon'
import { FireBallItem, IceBombItem } from 'modules/pvp/fireball-and-ice-bomb'

const defaultLoot = new Loot('dungeon_default_loot')
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

  .item(CustomItems.Money)
  .chance('100%')
  .amount({
    '10...20': '80%',
    '21...64': '20%',
  })

  .itemStack(FireBallItem)
  .chance('10%')
  .amount({
    '10...20': '80%',
    '21...64': '20%',
  })

  .itemStack(IceBombItem)
  .chance('10%')
  .amount({
    '10...20': '80%',
    '21...64': '20%',
  })

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' })

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' })

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' }).build

const d = StructureDungeonsId

const names: Record<StructureDungeonsId, string> = {
  [d.GasStation1]: 'Заправка 1',
  [d.GasStation2]: 'Заправка 2',
  [d.GasStation3]: 'Заправка 3',
  [d.GasStation4]: 'Заправка 4',
  [d.GasStationGarage]: 'Гараж',
  [d.Avanpost]: 'Аванпост',
}

const coolLoot: Partial<Record<StructureDungeonsId, LootTable>> = {
  [d.Avanpost]: new Loot(d.Avanpost + '2').item('GoldenApple').chance('100%').build,
}

const loot: Record<StructureDungeonsId, LootTable> = {
  [d.GasStation1]: defaultLoot,
  [d.GasStation2]: defaultLoot,
  [d.GasStation3]: defaultLoot,
  [d.GasStation4]: defaultLoot,
  [d.Avanpost]: new Loot(d.Avanpost).item('Apple').chance('100%').build,
  [d.GasStationGarage]: new Loot(`dungeon ${d.GasStationGarage}`)
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

    .item(CustomItems.Money)
    .chance('100%')
    .amount({
      '10...20': '80%',
      '21...64': '20%',
    })

    .itemStack(FireBallItem)
    .chance('10%')
    .amount({
      '10...20': '80%',
      '21...64': '20%',
    })

    .itemStack(IceBombItem)
    .chance('10%')
    .amount({
      '10...20': '80%',
      '21...64': '20%',
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
    .amount({ '1...2': '1%' }).build,
}

export const Dungeon = {
  loot,
  coolLoot,
  defaultLoot,
  names,
}
