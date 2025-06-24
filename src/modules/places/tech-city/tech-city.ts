import { Loot } from 'lib'
import { t } from 'lib/i18n/text'
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
    super('TechCity', t`Техноград`)
    this.create()
  }

  engineer = new Engineer(this.group)

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  golem = createBossGolem(this.group)

  guide = new GuideNpc(this.group, t`Техник`, (f, { lf }) => {
    lf.question('wtfCity', t`А что за город`, t`Ну крутой техно типо не понял что ли`)
  })

  private create() {
    if (this.safeArea) {
      QuartzMineRegion.create(new CutArea({ parent: this.safeArea.area.toJSON(), cut: { axis: 'y', to: 56 } }))
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
