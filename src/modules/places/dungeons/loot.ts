import { Loot, LootTable } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { StructureDungeonsId } from 'lib/assets/structures'
import { i18n } from 'lib/i18n/text'
import { CannonItem, CannonShellItem } from 'modules/pvp/cannon'
import { FireBallItem } from 'modules/pvp/fireball'
import { IceBombItem } from 'modules/pvp/ice-bomb'
import { BaseItem } from '../base/base'

const defaultLoot = new Loot('dungeon_default_loot')
  .itemStack(CannonShellItem.blueprint)
  .weight('5%')

  .item('Apple')
  .weight('10%')
  .amount({
    '3...8': '1%',
  })

  .item(Items.Money)
  .weight('100%')
  .amount({
    '10...20': '80%',
    '21...64': '20%',
  })

  .itemStack(FireBallItem)
  .weight('20%')
  .amount({
    '10...32': '1%',
  })

  .itemStack(IceBombItem)
  .weight('20%')
  .amount({
    '10...32': '1%',
  })

  .item('BakedPotato')
  .weight('20%')
  .amount({
    '5...15': '1%',
  })

  .item('PoisonousPotato')
  .weight('10%')
  .amount({
    '1...3': '1%',
  })

  .trash({ web: 3, string: 1 }).build

const d = StructureDungeonsId

const names: Record<string, Text> = {
  [d.GasStation1]: i18n`Заправка 1`,
  [d.GasStation2]: i18n`Заправка 2`,
  [d.GasStation3]: i18n`Заправка 3`,
  [d.GasStation4]: i18n`Заправка 4`,
  [d.GasStationGarage]: i18n`Гараж`,
  [d.Avanpost]: i18n`§cАванпост`,
} satisfies Record<StructureDungeonsId, Text>

const customNames: Record<string, Text> = {
  bunker: i18n`§4Бункер`,
  avanpostTent: i18n`§cПалатка аванпоста`,
}

const powerfullLoot: Record<string, LootTable | undefined> = {
  [d.Avanpost]: new Loot(d.Avanpost + ' powerfull')
    .item('GoldenApple')
    .weight('10%')
    .amount({
      '5...20': '1%',
    })

    .item('IronIngot')
    .weight('10%')
    .amount({
      '5...10': '1%',
    })

    .item('GoldenCarrot')
    .weight('10%')
    .amount({
      '5...20': '1%',
    })

    .item('GoldIngot')
    .weight('5%')
    .amount({
      '5...10': '1%',
    })

    .item('TotemOfUndying')
    .weight('5%')

    .item(Items.Money)
    .weight('100%')
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
    .weight('10%')
    .amount({
      '5...20': '1%',
    })

    .item('IronIngot')
    .weight('5%')
    .amount({
      '5...10': '1%',
    })

    .item('Carrot')
    .weight('10%')
    .amount({
      '5...20': '1%',
    })

    .item(Items.Money)
    .weight('100%')
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
    .weight('10%')
    .amount({
      '10...20': '20%',
      '21...64': '80%',
    })

    .itemStack(IceBombItem)
    .weight('10%')
    .amount({
      '10...20': '20%',
      '21...64': '80%',
    })

    .item(Items.Money)
    .weight('100%')
    .amount({
      '10...20': '10%',
      '21...64': '90%',
    })
    .duplicate(3)
    .trash({ string: 1, web: 3 }).build,

  bunkerPowerfullChest: new Loot('bunker powerfull chest')
    .item('Diamond')
    .weight('100%')
    .amount({
      '10...20': '10%',
      '21...64': '90%',
    })
    .item('NetheriteSword')
    .weight('1%')
    .enchantmetns({
      Sharpness: { '1...3': '1%', '4...5': '10%' },
    })

    .itemStack(CannonItem.itemStack)
    .weight('40%')
    .amount({ '1...2': '1%' })

    .itemStack(CannonShellItem.itemStack)
    .weight('60%')
    .amount({
      '1...9': '10%',
      '10...16': '1%',
    })

    .itemStack(BaseItem.itemStack)
    .weight('5%')
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
