import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Jeweler extends ShopNpc {
  constructor(group: Group, point = group.point('jeweler').name('Ювелир')) {
    super(point)
    this.shop.body(() => 'Украшения я делать пока не умею.\n\n')

    this.shop.menu(form => {
      form
        .dynamicCostItem(i.Coal)
        .dynamicCostItem(i.CopperIngot)
        .dynamicCostItem(i.LapisLazuli)
        .dynamicCostItem(i.IronIngot)
        .dynamicCostItem(i.GoldIngot)
        .dynamicCostItem(i.Diamond)
        .dynamicCostItem(i.Emerald)
    })
  }
}
