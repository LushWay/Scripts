import { BaseItem } from '../base/base'
import { City } from '../lib/city'
import { CannonBulletItem, CannonItem, Engineer } from './engineer'

class TechCityBuilder extends City {
  constructor() {
    super('TechCity', 'Техноград')
    this.create()
  }

  engineer = new Engineer(this.group)

  private create() {
    const { normal, donut } = this.createKits(
      normal =>
        normal
          .itemStack(CannonItem.blueprint)
          .chance('20%')

          .itemStack(CannonBulletItem.blueprint)
          .chance('10%')

          .item('RedTerracotta')
          .amount({
            '20...40': '70%',
            '41...64': '30%',
          })
          .chance('5%').build,

      donut =>
        donut
          .itemStack(CannonBulletItem.blueprint)
          .chance('40%')

          .itemStack(CannonBulletItem.itemStack)
          .chance('0.004%')

          .itemStack(CannonItem.blueprint)
          .chance('30%')

          .itemStack(CannonItem.itemStack)
          .chance('0.003%')

          .itemStack(BaseItem.blueprint)
          .chance('20%')

          .itemStack(BaseItem.itemStack)
          .chance('0.002%').build,
    )

    new Command('techcity').setPermissions('techAdmin').executes(ctx => {
      ctx.player.container?.addItem(normal.createKeyItemStack())
      ctx.player.container?.addItem(donut.createKeyItemStack())
    })
  }
}

export const TechCity = new TechCityBuilder()
