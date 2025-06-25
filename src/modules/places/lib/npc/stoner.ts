import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.place('stoner').name(i18nShared`Каменщик`))
    this.shop.body(() => i18n`А камень я тебе дам.\n\n`)

    this.shop.menu(form => {
      form
        .dynamicCostItem(i.Cobblestone)
        .dynamicCostItem(i.Andesite)
        .dynamicCostItem(i.Diorite)
        .dynamicCostItem(i.Granite)
        .dynamicCostItem(i.Tuff)
        .dynamicCostItem(i.CobbledDeepslate)
        .dynamicCostItem(i.Calcite)
    })
  }
}
