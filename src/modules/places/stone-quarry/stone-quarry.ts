import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Loot } from 'lib'
import { i18n, i18nShared } from 'lib/i18n/text'
import { AuntZina } from 'modules/places/stone-quarry/aunt-zina'
import { Barman } from 'modules/places/stone-quarry/barman'
import { Horseman } from 'modules/places/stone-quarry/horseman'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { Furnacer } from './furnacer'
import { Gunsmith } from './gunsmith'
import { createBossWither } from './wither.boss'

class StoneQuarryBuilder extends City {
  constructor() {
    super('StoneQuarry', i18nShared`Каменоломня`)
    this.create()
  }

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  auntzina = new AuntZina(this.group)

  barman = new Barman(this.group)

  coachman = new Horseman(this.group)

  stoner = new Stoner(this.group)

  wither = createBossWither(this.group)

  commonOvener = Furnacer.create()
    .group(this.group)
    .id('ovener')
    .name(i18nShared`Печкин`)
    .furnaceTypeIds([
      MinecraftBlockTypes.BlastFurnace,
      MinecraftBlockTypes.LitBlastFurnace,
      MinecraftBlockTypes.Furnace,
      MinecraftBlockTypes.LitFurnace,
    ])
    .onlyInStoneQuarry(true)

  foodOvener = Furnacer.create()
    .group(this.group)
    .id('foodOvener')
    .name(i18nShared`Баба валя`)
    .furnaceTypeIds([MinecraftBlockTypes.Smoker, MinecraftBlockTypes.LitSmoker])
    .onlyInStoneQuarry(false)

  gunsmith = new Gunsmith(this.group)

  guide = new GuideNpc(this.group, i18nShared`Ломщик`, (f, { lf }) => {
    lf.question('wtfCity', i18n`А что за город`, i18n`Ну типа крутой камни ломаем вот да`)
  })

  private create() {
    this.createKits(
      new Loot()
        .item('IronIngot')
        .amount({
          '20...40': '70%',
          '41...64': '30%',
        })
        .weight('50%')

        .itemStack(() => this.commonOvener.createItemKey())
        .weight('20%')

        .itemStack(() => this.foodOvener.createItemKey())
        .weight('20%')

        .item('IronSword')
        .enchantmetns({ Sharpness: { '0...8': '1%' }, Unbreaking: { '0...1': '1%' } })
        .weight('20%').build,
      new Loot()
        .item('Diamond')
        .amount({
          '20...40': '70%',
          '41...64': '30%',
        })
        .weight('50%')

        .item('NetherStar')
        .weight('1%')

        .item('NetheriteSword')
        .enchantmetns({ Sharpness: { '0...4': '1%' }, Unbreaking: { '0...1': '1%' } })
        .weight('10%').build,
    )
  }
}

export const StoneQuarry = new StoneQuarryBuilder()
