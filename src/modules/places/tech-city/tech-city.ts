import { doNothing, Loot } from 'lib'
import { form } from 'lib/form/new'
import { CutArea } from 'lib/region/areas/cut'
import { Npc } from 'lib/rpg/npc'
import { CannonItem, CannonShellItem } from 'modules/pvp/cannon'
import { QuartzMineRegion } from '../anarchy/quartz'
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

  guide = new Npc(this.group.place('guide').name('Техник'), ({ player }) => {
    form(f => {
      f.title(this.guide.name)
      f.button('Скоро здесь будут задания', doNothing)
    }).show(player)
    return true
  })

  private create() {
    if (this.safeArea) {
      QuartzMineRegion.create(new CutArea({ parent: this.safeArea.area.toJSON(), cut: { axis: 'y', to: 56 } }))
    }

    const { normal, donut } = this.createKits(
      new Loot()
        .itemStack(CannonItem.blueprint)
        .weight('10%')

        .itemStack(CannonShellItem.blueprint)
        .weight('10%')

        .item('RedTerracotta')
        .amount({
          '20...40': '70%',
          '41...64': '30%',
        })
        .weight('10%').build,

      new Loot()
        .itemStack(CannonShellItem.blueprint)
        .weight('3%')

        .itemStack(CannonShellItem.itemStack)
        .weight('3%')

        .itemStack(CannonItem.blueprint)
        .weight('2%')

        .itemStack(CannonItem.itemStack)
        .weight('2%')

        .itemStack(BaseItem.blueprint)
        .weight('1%')

        .itemStack(BaseItem.itemStack)
        .weight('1%').build,
    )

    new Command('techcity').setPermissions('techAdmin').executes(ctx => {
      ctx.player.container?.addItem(normal.createKeyItemStack())
      ctx.player.container?.addItem(donut.createKeyItemStack())
    })
  }
}

export const TechCity = new TechCityBuilder()
