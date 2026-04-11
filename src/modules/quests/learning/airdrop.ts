import { Items } from 'lib/assets/custom-items'
import { Loot } from 'lib/rpg/loot-table'

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

  .item('Apple')
  .weight('100%')
  .amount({ '5': '100%' })

  .item('Cookie')
  .weight('100%')
  .amount({ '3': '100%' })

  .item(Items.Money)
  .weight('100%')
  .amount({ '64': '100%' })

  .item(Items.Money)
  .weight('100%')
  .amount({ '64': '100%' }).build
