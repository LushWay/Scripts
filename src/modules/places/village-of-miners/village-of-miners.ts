import { Loot, migrateLocationName } from 'lib'
import { i18n, i18nShared } from 'lib/i18n/text'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { GuideNpc } from '../lib/npc/guide'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { stoneQuarryInvestigating } from '../stone-quarry/quests/investigating'
import { createMineQuests } from './quests/mine-x-blocks'

class VillageOfMinersBuilder extends City {
  constructor() {
    super('VillageOfMiners', i18nShared`Деревня шахтеров`)
    this.create()

    migrateLocationName('quest: learning', 'miner', this.group.id, 'guide')
  }

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().item('Dirt').build)
  }

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  guide = new GuideNpc(this.group, i18nShared`Шахтер`, (f, { lf }) => {
    lf.question(
      'whereIam',
      i18n`Где я?`,
      i18n`Это поселение называется "Деревня Шахтеров" - одно из сохранившихся поселений после войны.`,
    )

    lf.question(
      'areYouSingle',
      i18n`Ты единственный путеводитель??`,
      i18n`Нет, у меня есть коллеги. Особый путеводитель есть в каждом поселении.`,
    )

    lf.question(
      'areThisCitySingle',
      i18n`Сколько ещё сохранилось поселений?`,
      i18n`Можно узнать это, если посмотреть на карту и присесть.`,
    )

    lf.question(
      'wtfIsThisMineShaft',
      i18n`Почему шахта такая странная?`,
      i18n`Это магическая шахта. Она сама восстанавливается через некоторое время. Как ты заметил, руду на поверхности ты не найдёшь, так что копай вглубь по бокам тунелей.`,
    )

    lf.question(
      'canIGetLostInMineShaft',
      i18n`Я могу потеряться в шахте?`,
      i18n`Она в целом очень опасная и скрывает множество тайн. Я бы не советовал далеко отходить от опор и мостиков.`,
    )

    lf.question(
      'salaryBro',
      i18n`Сколько тебе платят?`,
      i18n`Мне не платят, мне просто интересно смотреть за развитием таких лошков новичков, как ты.`,
    )

    lf.question(
      'airdrop',
      i18n`Сверху упал сундук, что это?`,
      i18n`Это стартовый аирдроп. Подобными переодически снабжают выживших. Отслеживать аирдропы можно на карте или в чате.`,
    )

    lf.question(
      'whyNoBros',
      i18n`Почему тут нет жителей?`,
      i18n`Они есть... просто они сидят дома и смотрят стрим @shp1natqp`,
    )

    f.quest(
      stoneQuarryInvestigating.goToCityQuest,
      i18n`Как мне переплавить руду?`,
      i18n`Возьми у меня задание и отправляйся в другое поселение следуя компасу.`,
    )
  })

  mineQuests = createMineQuests(this)
}

export const VillageOfMiners = new VillageOfMinersBuilder()
