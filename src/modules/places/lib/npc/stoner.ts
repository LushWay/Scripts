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
        .defaultCount(10_000)
        .maxCount(20_000)
        .basePrice(1)

        .dynamicCostItem(i.Andesite)
        .defaultCount(1_000)
        .maxCount(10_000)
        .basePrice(1)

        .dynamicCostItem(i.Diorite)
        .defaultCount(2_000)
        .maxCount(10_000)
        .basePrice(1)

        .dynamicCostItem(i.Granite)
        .defaultCount(3_000)
        .maxCount(10_000)
        .basePrice(1)

        .dynamicCostItem(i.Tuff)
        .defaultCount(2_000)
        .maxCount(10_000)
        .basePrice(1)

        .dynamicCostItem(i.Deepslate)
        .defaultCount(100)
        .maxCount(20_000)
        .basePrice(2)

        .dynamicCostItem(i.Calcite)
        .defaultCount(10)
        .maxCount(1000)
        .basePrice(10)
    })
  }
}
