import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { Loot, migrateLocationName } from 'lib'
import { DailyQuest } from 'lib/quest/quest'
import { Npc } from 'lib/rpg/npc'
import { Rewards } from 'lib/utils/rewards'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { stoneQuarryInvestigating } from '../stone-quarry/quests/investigating'

class VillageOfMinersBuilder extends City {
  constructor() {
    super('VillageOfMiners', 'Деревня шахтеров')
    this.create()

    migrateLocationName('quest: learning', 'miner', this.group.id, 'guide')
  }

  private create() {
    this.createKits(new Loot().item('Dirt').build, new Loot().item('Dirt').build)
  }

  stoner = new Stoner(this.group)

  butcher = new Butcher(this.group)

  woodman = new Woodman(this.group)

  guide = Npc.form(this.group.place('guide').name('Шахтер'), (f, { lf }) => {
    f.title(this.guide.name)
    lf.question(
      'whereIam',
      'Где я?',
      'Это поселение называется "Деревня Шахтеров" - одно из сохранившихся поселений после войны.',
    )

    lf.question(
      'areYouSingle',
      'Ты единственный путеводитель??',
      'Нет, у меня есть коллеги. Особый путеводитель есть в каждом поселении.',
    )

    lf.question(
      'areThisCitySingle',
      'Сколько ещё сохранилось поселений?',
      'Можно узнать это, если посмотреть на карту и присесть.',
    )

    lf.question(
      'wtfIsThisMineShaft',
      'Почему шахта такая странная?',
      'Это магическая шахта. Она сама восстанавливается через некоторое время. Как ты заметил, руду на поверхности ты не найдёшь, так что копай вглубь по бокам тунелей.',
    )

    lf.question(
      'canIGetLostInMineShaft',
      'Я могу потеряться в шахте?',
      'Она в целом очень опасная и скрывает множество тайн. Я бы не советовал далеко отходить от опор и мостиков.',
    )

    lf.question(
      'salaryBro',
      'Сколько тебе платят?',
      'Мне не платят, мне просто интересно смотреть за развитием таких лошков новичков, как ты.',
    )

    lf.question(
      'airdrop',
      'Сверху упал сундук, что это?',
      'Это стартовый аирдроп. Подобными переодически снабжают выживших. Отслеживать аирдропы можно на карте или в чате.',
    )

    lf.question('whyNoBros', 'Почему тут нет жителей?', 'Они есть... просто они сидят дома и смотрят стрим @shp1natqp')

    f.quest(
      stoneQuarryInvestigating.goToCityQuest,
      'Как мне переплавить руду?',
      'Возьми у меня задание и отправляйся в другое поселение следуя компасу.',
    )

    f.quest(this.mine10Iron, 'Где добыть еще больше железа?')
    f.quest(this.mine10Coal, 'Где добыть угля?')
    f.quest(this.mine10Diamonds, 'Где добыть алмазы?')
  })

  createMineQuest(id: string, text: string, amount: number, itemTypes: string[], rewards: Rewards) {
    return new DailyQuest(
      this.group.place(id).name(text),
      'Спустись в шахту в деревне шахтеров и вскопай указанный ресурс!',
      q => {
        q.breakCounter((c, end) => `${c}/${end}`, amount).filter(({ type: { id } }) => itemTypes.includes(id))

        q.button().reward(rewards).target(this.guide.location.toPoint())
      },
    )
  }

  mine10Iron = this.createMineQuest(
    'mine-10-iron',
    'Добыть железо',
    10,
    [b.IronOre, b.DeepslateIronOre],
    new Rewards().money(600),
  )

  mine10Coal = this.createMineQuest(
    'mine-10-coal',
    'Добыть уголь',
    10,
    [b.CoalOre, b.DeepslateCoalOre],
    new Rewards().money(400),
  )

  mine10Diamonds = this.createMineQuest(
    'mine-10-diamonds',
    'Добыть алмазы',
    10,
    [b.DiamondOre, b.DeepslateDiamondOre],
    new Rewards().money(1000),
  )
}

export const VillageOfMiners = new VillageOfMinersBuilder()
