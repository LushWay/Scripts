import { Loot, LootTable } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { StructureDungeonsId } from 'lib/assets/structures'
import { CannonItem, CannonShellItem } from 'modules/pvp/cannon'
import { FireBallItem } from 'modules/pvp/fireball'
import { IceBombItem } from 'modules/pvp/ice-bomb'
import { BaseItem } from '../base/base'

const defaultLoot = new Loot('dungeon_default_loot')
  .itemStack(CannonShellItem.blueprint)
  .chance('1%')

  .item('Apple')
  .chance('5%')
  .amount({
    '5...20': '1%',
  })

  .item(Items.Money)
  .chance('100%')
  .amount({
    '10...20': '80%',
    '21...64': '20%',
  })

  .itemStack(FireBallItem)
  .chance('10%')
  .amount({
    '10...32': '1%',
  })

  .itemStack(IceBombItem)
  .chance('10%')
  .amount({
    '10...32': '1%',
  })

  .item('BakedPotato')
  .chance('10%')
  .amount({
    '5...10': '80%',
    '11...30': '20%',
  })
  .trash({ web: 4, string: 1 }).build

const d = StructureDungeonsId

const names: Record<string, string> = {
  [d.GasStation1]: 'Заправка 1',
  [d.GasStation2]: 'Заправка 2',
  [d.GasStation3]: 'Заправка 3',
  [d.GasStation4]: 'Заправка 4',
  [d.GasStationGarage]: 'Гараж',
  [d.Avanpost]: '§cАванпост',
} satisfies Record<StructureDungeonsId, string>

const customNames: Record<string, string> = {
  bunker: '§4Бункер',
  avanpostTent: '§cПалатка аванпоста',
}

const powerfullLoot: Record<string, LootTable | undefined> = {
  [d.Avanpost]: new Loot(d.Avanpost + ' powerfull')
    .item('GoldenApple')
    .chance('10%')
    .amount({
      '5...20': '1%',
    })

    .item('IronIngot')
    .chance('10%')
    .amount({
      '5...10': '1%',
    })

    .item('GoldenCarrot')
    .chance('10%')
    .amount({
      '5...20': '1%',
    })

    .item('GoldIngot')
    .chance('5%')
    .amount({
      '5...10': '1%',
    })

    .item('TotemOfUndying')
    .chance('5%')

    .item(Items.Money)
    .chance('100%')
    .amount({
      '10...20': '80%',
      '21...64': '20%',
    }).build,
} satisfies Partial<Record<StructureDungeonsId, LootTable>>

const loot: Record<string, LootTable | undefined> = {
  [d.GasStation1]: defaultLoot,
  [d.GasStation2]: defaultLoot,
  [d.GasStation3]: defaultLoot,
  [d.GasStation4]: defaultLoot,
  [d.Avanpost]: new Loot(d.Avanpost)
    .item('Apple')
    .chance('10%')
    .amount({
      '5...20': '1%',
    })

    .item('IronIngot')
    .chance('5%')
    .amount({
      '5...10': '1%',
    })

    .item('Carrot')
    .chance('10%')
    .amount({
      '5...20': '1%',
    })

    .item(Items.Money)
    .chance('100%')
    .amount({
      '10...20': '80%',
      '21...64': '20%',
    }).build,
  [d.GasStationGarage]: defaultLoot,
} satisfies Record<StructureDungeonsId, LootTable>

const customLoot: Record<string, LootTable | undefined> = {
  ...loot,
  ...Object.map(powerfullLoot, (key, loot) => ['powerfull ' + key, loot]),
  defaultLoot,
  bunker1Chest: new Loot('bunker 1 type chest')
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

  bunkerPowerfullChest: new Loot('bunker powerfull chest')
    .item('Diamond')
    .chance('100%')
    .amount({
      '10...20': '10%',
      '21...64': '90%',
    })
    .item('NetheriteSword')
    .chance('1%')
    .enchantmetns({
      'minecraft:sharpness': { '1...3': '1%', '4...5': '10%' },
    })

    .itemStack(CannonItem.itemStack)
    .chance('40%')
    .amount({ '1...2': '1%' })

    .itemStack(CannonShellItem.itemStack)
    .chance('60%')
    .amount({
      '1...9': '10%',
      '10...16': '1%',
    })

    .itemStack(BaseItem.itemStack)
    .chance('5%')
    .amount({ '0...1': '1%' })

    .trash({ string: 3, web: 10 }).build,
}

export const Dungeon = {
  loot,
  powerfullLoot,
  defaultLoot,
  names,
  customLoot,
  customNames,
}
