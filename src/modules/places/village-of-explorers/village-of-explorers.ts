import { Loot } from 'lib'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { techCityInvestigating } from '../tech-city/quests/investigating'
import { MagicSlimeBall } from './items'
import { Mage } from './mage'
import { createBossSlime } from './slime.boss'

class VillageOfExporersBuilder extends City {
  constructor() {
    super('VillageOfExporers', 'Деревня исследователей')
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

  guide = new GuideNpc(this.group, 'Исследователь', (f, { lf }) => {
    lf.question(
      'wtfCity',
      'А что за город',
      'Исследователи тип, не понял что ли, глупик, путешествуй смотри наслаждайся, ИССЛЕДУЙ',
    )

    f.quest(techCityInvestigating.goToCityQuest, 'А где мне базу сделать-то?')
  })
}

export const VillageOfExplorers = new VillageOfExporersBuilder()
