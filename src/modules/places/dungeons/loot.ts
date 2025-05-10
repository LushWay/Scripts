import { Loot, LootTable } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { StructureDungeonsId } from 'lib/assets/structures'
import { CannonShellItem } from 'modules/features/cannon'
import { FireBallItem, IceBombItem } from 'modules/pvp/fireball-and-ice-bomb'

const defaultLoot = new Loot('dungeon_default_loot')
  .itemStack(CannonShellItem.blueprint)
  .chance('10%')

  .item(Items.Money)
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

  .trash({ web: 4, string: 1 }).build

const d = StructureDungeonsId

const names: Record<StructureDungeonsId, string> = {
  [d.GasStation1]: 'Заправка 1',
  [d.GasStation2]: 'Заправка 2',
  [d.GasStation3]: 'Заправка 3',
  [d.GasStation4]: 'Заправка 4',
  [d.GasStationGarage]: 'Гараж',
  [d.Avanpost]: 'Аванпост',
}

const customNames: Record<string, string> = {
  factory: 'Заброшенный завод',
}

const powerfullLoot: Partial<Record<StructureDungeonsId, LootTable>> = {
  [d.Avanpost]: new Loot(d.Avanpost + ' powerfull').item('GoldenApple').chance('100%').build,
}

const loot: Record<StructureDungeonsId, LootTable> = {
  [d.GasStation1]: defaultLoot,
  [d.GasStation2]: defaultLoot,
  [d.GasStation3]: defaultLoot,
  [d.GasStation4]: defaultLoot,
  [d.Avanpost]: new Loot(d.Avanpost).item('Apple').chance('100%').build,
  [d.GasStationGarage]: new Loot(`dungeon ${d.GasStationGarage}`)
    .itemStack(CannonShellItem.blueprint)
    .chance('10%')

    .item('Apple')
    .chance('50%')

    .item(Items.Money)
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

    .trash({ string: 1, web: 8 }).build,
}

const custom = {
  ...loot,
  ...Object.map(powerfullLoot, (key, loot) => ['powerfull ' + key, loot]),
  defaultLoot,
  factoryCommonChest: new Loot('factory common chest')
    .itemStack(FireBallItem)
    .chance('10%')
    .amount({
      '10...20': '20%',
      '21...64': '80%',
    })

    .itemStack(IceBombItem)
    .chance('10%')
    .amount({
      '10...20': '20%',
      '21...64': '80%',
    })

    .item(Items.Money)
    .chance('100%')
    .amount({
      '10...20': '10%',
      '21...64': '90%',
    })
    .duplicate(3)
    .trash({ string: 1, web: 3 }).build,

  factoryPowerfullChest: new Loot('factory powerfull chest')
    .item('Diamond')
    .chance('100%')
    .amount({
      '10...20': '10%',
      '21...64': '90%',
    })
    .item('NetheriteIngot')
    .chance('100%')
    .amount({
      '10...20': '10%',
      '21...64': '1%',
    })
    .item('NetheriteSword')
    .chance('10%')
    .enchantmetns({
      'minecraft:sharpness': { '1...3': '1%', '4...5': '10%' },
    })
    .trash({ string: 3, web: 10 }).build,
}

export const Dungeon = {
  loot,
  powerfullLoot,
  defaultLoot,
  names,
  customLoot: custom,
  customNames,
}
