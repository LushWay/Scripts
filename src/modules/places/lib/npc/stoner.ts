import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.place('stoner').name('Каменщик'))
    this.shop.body(() => 'А камень я тебе дам.\n\n')

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
