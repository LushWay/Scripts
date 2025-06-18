import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { Loot, migrateLocationName } from 'lib'
import { form } from 'lib/form/new'
import { Quest } from 'lib/quest'
import { Npc } from 'lib/rpg/npc'
import { Rewards } from 'lib/utils/rewards'
import { City } from '../lib/city'
import { Butcher } from '../lib/npc/butcher'
import { Stoner } from '../lib/npc/stoner'
import { Woodman } from '../lib/npc/woodman'
import { stoneQuarryInvestigating } from '../stone-quarry/quests/investigating'
import { DailyQuest } from 'lib/quest/quest'

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

  guide = new Npc(this.group.place('guide').name('Шахтер'), ({ player }) => {
    form(f => {
      f.title(this.guide.name)
      f.button(
        form(f => {
          f.title('Где я?')
          f.body('Это поселение называется "Деревня Шахтеров" - одно из сохранившихся поселений после войны.')
        }),
      )
      f.button(
        form(f => {
          f.title('Ты единственный путеводитель??')
          f.body('Нет, у меня есть коллеги. Особый путеводитель есть в каждом поселении.')
        }),
      )
      f.button(
        form(f => {
          f.title('Как мне переплавить руду?')
          f.body('Возьми у меня залание и отправляйся в другое поселение следуя компасу.')
        }),
      )
      f.button(
        form(f => {
          f.title('Сколько ещё сохранилось поселений?')
          f.body('Можно узнать это, если посмотреть на карту и присесть.')
        }),
      )
      f.button(
        form(f => {
          f.title('Почему шахта такая странная?')
          f.body(
            'Это магическая шахта. Она сама восстанавливается через некоторое время. Как ты заметил, руду на поверхности ты не найдёшь, так что копай вглубь по бокам тунелей.',
          )
        }),
      )
      f.button(
        form(f => {
          f.title('Я могу потеряться в шахте? ')
          f.body(
            'Она в целом очень опасная и скрывает множество тайн. Я бы не советовал далеко отходить от опор и мостиков. ',
          )
        }),
      )
      f.button(
        form(f => {
          f.title('Сколько тебе платят?')
          f.body('Мне не платят, мне просто интересно смотреть за развитием таких лошков новичков, как ты.')
        }),
      )
      f.button(
        form(f => {
          f.title('Сверху упал сундук, что это?')
          f.body(
            'Это стартовый аирдроп. Подобными переодически снабжают выживших. Отслеживать аирдропы можно на карте или в чате.',
          )
        }),
      )
      f.button(
        form(f => {
          f.title('Почему тут нет жителей? ')
          f.body('Они есть... просто они сидят дома и смотрят стрим @shp1natqp')
        }),
      )
      f.quest(stoneQuarryInvestigating.goToCityQuest, 'Где мне переплавить железо?', 'Возьму')

      f.quest(this.mine10Iron, 'Где добыть еще больше железа?')
      f.quest(this.mine10Coal, 'Где добыть угля?')
      f.quest(this.mine10Diamonds, 'Где добыть алмазы?')
    }).show(player)
    return true
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
