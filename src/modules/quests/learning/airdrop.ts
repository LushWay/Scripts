import { Loot } from 'lib'
import { Items } from 'lib/assets/custom-items'

export default new Loot('starter')
  .item('WoodenSword')
  .weight('100%')
  .enchantmetns({ Unbreaking: { '0...2': '40%', '3': '60%' } })

  .item('LeatherBoots')
  .weight('100%')

  .item('LeatherLeggings')
  .weight('100%')
  .enchantmetns({ Unbreaking: { '0...2': '50%', '3': '50%' } })

  .item('LeatherChestplate')
  .weight('100%')

  .item('LeatherHelmet')
  .weight('100%')

  .item('CookedBeef')
  .weight('100%')
  .amount({
    '10...20': '50%',
    '21...32': '10%',
  })

  .item(Items.Money)
  .weight('100%')
  .amount({ '64': '100%' })

  .item(Items.Money)
  .weight('100%')
  .amount({ '64': '100%' }).build
