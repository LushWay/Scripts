import { Loot } from 'lib'
import { i18n, i18nShared } from 'lib/i18n/text'
import { CutArea } from 'lib/region/areas/cut'
import { CannonItem, CannonShellItem } from 'modules/pvp/cannon'
import { QuartzMineRegion } from '../anarchy/quartz'
import { BaseItem } from '../base/base'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Engineer } from './engineer'
import { createBossGolem } from './golem.boss'

class TechCityBuilder extends City {
  constructor() {
    super('TechCity', i18nShared`Техноград`)
    this.create()
  }

  engineer = new Engineer(this.group)

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  golem = createBossGolem(this.group)

  guide = new GuideNpc(this.group, i18nShared`Техник`, (f, { lf }) => {
    lf.question('wtfCity', i18n`А что за город`, i18n`Ну крутой техно типо не понял что ли`)
  })

  private create() {
    if (this.safeArea) {
      QuartzMineRegion.create(new CutArea({ parent: this.safeArea.area.toJSON(), cut: { axis: 'y', to: 63 } }))
    }

    this.createKits(
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
  }
}

export const TechCity = new TechCityBuilder()
