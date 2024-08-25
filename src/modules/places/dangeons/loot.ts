import { Loot } from 'lib'
import { CustomItems } from 'lib/assets/config'
import { StructureId } from 'lib/assets/structures'
import { CannonBulletItem } from 'modules/features/cannon'

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

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' })

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' })

  .item('Web')
  .chance('40%')
  .amount({ '1...2': '1%' }).build

const names = {
  [StructureId.DungeonsGasStation1]: 'Заправка 1',
  [StructureId.DungeonsGasStation2]: 'Заправка 2',
  [StructureId.DungeonsGasStation3]: 'Заправка 3',
  [StructureId.DungeonsGasStation4]: 'Заправка 4',
  [StructureId.DungeonsGasStationGarage]: 'Гараж',
}
const loot = {
  [StructureId.DungeonsGasStation1]: defaultLoot,
  [StructureId.DungeonsGasStation2]: defaultLoot,
  [StructureId.DungeonsGasStation3]: defaultLoot,
  [StructureId.DungeonsGasStation4]: defaultLoot,
  [StructureId.DungeonsGasStationGarage]: new Loot(`dungeon ${StructureId.DungeonsGasStationGarage}`)
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
    .amount({ '1...2': '1%' }).build,
}

export const Dungeon = {
  loot,
  defaultLoot,
  names,
}
