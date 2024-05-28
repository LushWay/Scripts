import { Loot } from 'lib'
import { CUSTOM_ITEMS } from 'lib/assets/config'

export default new Loot('starter')
  .item('WoodenSword')
  .chance('100%')
  .enchantmetns({ unbreaking: { '0...2': '40%', '3': '60%' } })

  .item('LeatherBoots')
  .chance('100%')

  .item('LeatherLeggings')
  .chance('100%')
  .enchantmetns({ unbreaking: { '0...2': '50%', '3': '50%' } })

  .item('LeatherChestplate')
  .chance('100%')

  .item('LeatherHelmet')
  .chance('100%')

  .item('CookedBeef')
  .chance('100%')
  .amount({
    '10...30': '50%',
    '31...64': '10%',
  })

  .item(CUSTOM_ITEMS.money)
  .chance('100%')
  .amount({ '90...100': '1%' }).build
