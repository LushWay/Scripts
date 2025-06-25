import { MinecraftBlockTypes as b } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { DailyQuest } from 'lib/quest/quest'
import { Rewards } from 'lib/utils/rewards'
import { City } from 'modules/places/lib/city'
import { ores } from 'modules/places/mineshaft/algo'

export function createMineQuests(city: City) {
  function createMineQuest(id: string, text: SharedText, amount: number, itemTypes: string[], rewards: Rewards) {
    return new DailyQuest(
      city.group.place(id).name(text),
      i18n`Спустись в шахту в деревне шахтеров и вскопай указанный ресурс!`,
      (q, player) => {
        const ore = itemTypes[0] && ores.getOre(itemTypes[0])
        if (!ore) return q.failed('No ore found', true)

        let y = ~~player.location.y

        const { below, above } = ore.ore.item
        const inRange = () => y < below && y > above

        q.breakCounter(
          (c, end) =>
            inRange()
              ? `${c}/${end} y=${above}..${y}..${below}`
              : i18n.error`Копать нужно на высоте ${above}..${below}. Ваш y = ${y}`,
          amount,
        )
          .filter(({ type: { id } }) => itemTypes.includes(id))
          .activate(ctx => {
            ctx.onInterval(() => {
              y = ~~player.location.y
              ctx.update()
            })
          })

        q.button().reward(rewards).target(city.guide.location.toPoint())
      },
    )
  }

  const iron10 = createMineQuest(
    'mine-10-iron',
    i18nShared`Добыть железо`,
    10,
    [b.IronOre, b.DeepslateIronOre],
    new Rewards().money(600),
  )

  const coal10 = createMineQuest(
    'mine-10-coal',
    i18nShared`Добыть уголь`,
    10,
    [b.CoalOre, b.DeepslateCoalOre],
    new Rewards().money(400),
  )

  const diamonds10 = createMineQuest(
    'mine-10-diamonds',
    i18nShared`Добыть алмазы`,
    10,
    [b.DiamondOre, b.DeepslateDiamondOre],
    new Rewards().money(1000),
  )

  return { iron10, coal10, diamonds10 }
}
