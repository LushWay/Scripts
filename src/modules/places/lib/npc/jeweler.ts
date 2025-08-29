import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Jeweler extends ShopNpc {
  constructor(group: Group, point = group.place('jeweler').name(i18nShared`Ювелир`)) {
    super(point)
    this.shop.body(() => i18n`Украшения я делать пока не умею.\n\n`)

    this.shop.menu(form => {
      form
        .dynamicCostItem(i.Coal)
        .dynamicCostItem(i.CopperIngot)
        .dynamicCostItem(i.LapisLazuli)
        .dynamicCostItem(i.IronIngot)
        .dynamicCostItem(i.GoldIngot)
        .dynamicCostItem(i.Diamond)
        .dynamicCostItem(i.Emerald)
        .dynamicCostItem(i.Redstone)
    })
  }
}
