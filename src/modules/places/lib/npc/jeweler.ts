import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Jeweler extends ShopNpc {
  constructor(group: Group) {
    super(group.point('jeweler').name('Ювелир'))
    this.shop.body(() => 'Украшения я делать пока не умею.\n\n')

    this.shop.menu(form => {
      ;(
        [
          [i.Coal, 3],
          [i.CopperIngot, 2],
          [i.Redstone, 4],
          [i.LapisLazuli, 0.1],
          [i.IronIngot, 2],
          [i.GoldOre, 0.5],
          [i.Diamond, 0.3],
          [i.Emerald, 0.1],
        ] as const
      ).forEach(([typeId, rarity]) => {
        form
          .dynamicCostItem(typeId)
          .defaultCount(10_000)
          .maxCount(rarity * 100_000)
          .basePrice((4 - rarity) * 10)
      })
    })
  }
}
