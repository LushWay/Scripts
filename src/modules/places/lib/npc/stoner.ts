import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { t } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.place('stoner').name(t`Каменщик`))
    this.shop.body(() => t`А камень я тебе дам.\n\n`)

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
