import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.point('stoner').name('Каменщик'))
    this.shop.body(() => 'А камень я тебе дам.\n\n')

    this.shop.menu(form => {
      form
        .dynamicCostItem(i.Cobblestone)
        .defaultCount(100)
        .maxCount(10_000)
        .minPrice(0.05)

        .dynamicCostItem(i.Andesite)
        .defaultCount(100)
        .maxCount(10_000)
        .minPrice(0.05)

        .dynamicCostItem(i.Diorite)
        .defaultCount(200)
        .maxCount(10_000)
        .minPrice(0.1)

        .dynamicCostItem(i.Granite)
        .defaultCount(300)
        .maxCount(10_000)
        .minPrice(0.1)

        .dynamicCostItem(i.Tuff)
        .defaultCount(200)
        .maxCount(10_000)
        .minPrice(0.1)

        .dynamicCostItem(i.CobbledDeepslate)
        .defaultCount(100)
        .maxCount(20_000)
        .minPrice(0.2)

        .dynamicCostItem(i.Calcite)
        .defaultCount(10)
        .maxCount(1000)
        .minPrice(1)
    })
  }
}
