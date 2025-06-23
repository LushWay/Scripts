import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'

export class Jeweler extends ShopNpc {
  constructor(group: Group, point = group.place('jeweler').name(t`Ювелир`)) {
    super(point)
    this.shop.body(() => t`Украшения я делать пока не умею.\n\n`)

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
