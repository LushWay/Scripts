import { i18n, i18nShared } from 'lib/i18n/text'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { techCityInvestigating } from '../tech-city/quests/investigating'
import { MagicSlimeBall } from './items'
import { Mage } from './mage'
import { createBossSlime } from './slime.boss'
import { Loot } from 'lib/rpg/loot-table'

class VillageOfExporersBuilder extends City {
  constructor() {
    super('VillageOfExporers', i18nShared`Деревня исследователей`)
    this.create()
  }

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  slimeBoss = createBossSlime(this.group)

  mage = new Mage(this.group)

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().itemStack(MagicSlimeBall).build)
  }

  stoner = new Stoner(this.group)

  guide = new GuideNpc(this.group, i18nShared`Исследователь`, (f, { lf }) => {
    lf.question(
      'wtfCity',
      i18n`А что за город`,
      i18n`Исследователи тип, не понял что ли, глупик, путешествуй смотри наслаждайся, ИССЛЕДУЙ`,
    )

    lf.quest(techCityInvestigating.goToCityQuest, i18n`А где мне базу сделать-то?`)
  })
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
