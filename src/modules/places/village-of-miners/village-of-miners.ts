import { Loot, migrateLocationName } from 'lib'
import { t } from 'lib/text'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { stoneQuarryInvestigating } from '../stone-quarry/quests/investigating'
import { createMineQuests } from './quests/mine-x-blocks'

class VillageOfMinersBuilder extends City {
  constructor() {
    super('VillageOfMiners', t`Деревня шахтеров`)
    this.create()

    migrateLocationName('quest: learning', 'miner', this.group.id, 'guide')
  }

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().item('Dirt').build)
  }

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  guide = new GuideNpc(this.group, t`Шахтер`, (f, { lf }) => {
    lf.question(
      'whereIam',
      t`Где я?`,
      t`Это поселение называется "Деревня Шахтеров" - одно из сохранившихся поселений после войны.`,
    )

    lf.question(
      'areYouSingle',
      t`Ты единственный путеводитель??`,
      t`Нет, у меня есть коллеги. Особый путеводитель есть в каждом поселении.`,
    )

    lf.question(
      'areThisCitySingle',
      t`Сколько ещё сохранилось поселений?`,
      t`Можно узнать это, если посмотреть на карту и присесть.`,
    )

    lf.question(
      'wtfIsThisMineShaft',
      t`Почему шахта такая странная?`,
      t`Это магическая шахта. Она сама восстанавливается через некоторое время. Как ты заметил, руду на поверхности ты не найдёшь, так что копай вглубь по бокам тунелей.`,
    )

    lf.question(
      'canIGetLostInMineShaft',
      t`Я могу потеряться в шахте?`,
      t`Она в целом очень опасная и скрывает множество тайн. Я бы не советовал далеко отходить от опор и мостиков.`,
    )

    lf.question(
      'salaryBro',
      t`Сколько тебе платят?`,
      t`Мне не платят, мне просто интересно смотреть за развитием таких лошков новичков, как ты.`,
    )

    lf.question(
      'airdrop',
      t`Сверху упал сундук, что это?`,
      t`Это стартовый аирдроп. Подобными переодически снабжают выживших. Отслеживать аирдропы можно на карте или в чате.`,
    )

    lf.question(
      'whyNoBros',
      t`Почему тут нет жителей?`,
      t`Они есть... просто они сидят дома и смотрят стрим @shp1natqp`,
    )

    f.quest(
      stoneQuarryInvestigating.goToCityQuest,
      t`Как мне переплавить руду?`,
      t`Возьми у меня задание и отправляйся в другое поселение следуя компасу.`,
    )
  })

  mineQuests = createMineQuests(this)
}

export const VillageOfMiners = new VillageOfMinersBuilder()
