import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Jeweler extends ShopNpc {
  constructor(group: Group, point = group.point('jeweler').name('Ювелир')) {
    super(point)
    this.shop.body(() => 'Украшения я делать пока не умею.\n\n')

    this.shop.menu(form => {
      ;(
        [
          [i.Coal, 3],
          [i.CopperIngot, 5],
          [i.Redstone, 5],
          [i.LapisLazuli, 0.1],
          [i.IronIngot, 2],
          [i.GoldIngot, 0.5],
          [i.Diamond, 0.2],
          [i.Emerald, 0.1],
        ] as const
      ).forEach(([typeId, rarity]) => {
        form
          .dynamicCostItem(typeId)
          .defaultCount(0)
          .maxCount(rarity * 10_000)
          .minPrice((4 - rarity) * 100)
      })
    })
  }
}
