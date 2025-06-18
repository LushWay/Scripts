import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { DailyQuest } from 'lib/quest/quest'
import { t } from 'lib/text'
import { Rewards } from 'lib/utils/rewards'
import { City } from 'modules/places/lib/city'
import { ores } from 'modules/places/mineshaft/algo'

export function createMineQuests(city: City) {
  function createMineQuest(id: string, text: string, amount: number, itemTypes: string[], rewards: Rewards) {
    return new DailyQuest(
      city.group.place(id).name(text),
      'Спустись в шахту в деревне шахтеров и вскопай указанный ресурс!',
      (q, player) => {
        const ore = itemTypes[0] && ores.getOre(itemTypes[0])
        if (!ore) return q.failed('No ore found', true)

        let y = player.location.y

        const { below, above } = ore.ore.item
        const inRange = () => y < below && y > above

        q.breakCounter(
          (c, end) =>
            inRange()
              ? `${c}/${end} y=${above}..${y}..${below}`
              : t.error`Копать нужно на высоте ${above}..${below}. Ваш y = ${y}`,
          amount,
        )
          .filter(({ type: { id } }) => itemTypes.includes(id))
          .activate(ctx => {
            ctx.onInterval(() => {
              y = player.location.y
              ctx.update()
            })
          })

        q.button().reward(rewards).target(city.guide.location.toPoint())
      },
    )
  }

  const iron10 = createMineQuest(
    'mine-10-iron',
    'Добыть железо',
    10,
    [b.IronOre, b.DeepslateIronOre],
    new Rewards().money(600),
  )

  const coal10 = createMineQuest(
    'mine-10-coal',
    'Добыть уголь',
    10,
    [b.CoalOre, b.DeepslateCoalOre],
    new Rewards().money(400),
  )

  const diamonds10 = createMineQuest(
    'mine-10-diamonds',
    'Добыть алмазы',
    10,
    [b.DiamondOre, b.DeepslateDiamondOre],
    new Rewards().money(1000),
  )

  return { iron10, coal10, diamonds10 }
}
