import { Loot } from 'lib'
import { CannonItem, CannonShellItem } from 'modules/features/cannon'
import { BaseItem } from '../base/base'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Engineer } from './engineer'
import { createBossGolem } from './golem.boss'

class TechCityBuilder extends City {
  constructor() {
    super('TechCity', 'Техноград')
    this.create()
  }

  engineer = new Engineer(this.group)

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  golem = createBossGolem(this.group)

  private create() {
    const { normal, donut } = this.createKits(
      new Loot()
        .itemStack(CannonItem.blueprint)
        .chance('10%')

        .itemStack(CannonShellItem.blueprint)
        .chance('10%')

        .item('RedTerracotta')
        .amount({
          '20...40': '70%',
          '41...64': '30%',
        })
        .chance('10%').build,

      new Loot()
        .itemStack(CannonShellItem.blueprint)
        .chance('3%')

        .itemStack(CannonShellItem.itemStack)
        .chance('3%')

        .itemStack(CannonItem.blueprint)
        .chance('2%')

        .itemStack(CannonItem.itemStack)
        .chance('2%')

        .itemStack(BaseItem.blueprint)
        .chance('1%')

        .itemStack(BaseItem.itemStack)
        .chance('1%').build,
    )

    new Command('techcity').setPermissions('techAdmin').executes(ctx => {
      ctx.player.container?.addItem(normal.createKeyItemStack())
      ctx.player.container?.addItem(donut.createKeyItemStack())
    })
  }
}

export const TechCity = new TechCityBuilder()
