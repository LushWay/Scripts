import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.point('stoner').name('Каменщик'))
    this.shop.body(() => 'А камень я тебе дам.\n\n')

    this.shop.menu(form => {
      form

        .sellableItem(i.Cobblestone)
        .defaultCount(1_000)
        .maxCount(20_000)
        .basePrice(2)

        .sellableItem(i.Andesite)
        .defaultCount(1_000)
        .maxCount(10_000)
        .basePrice(1)

        .sellableItem(i.Diorite)
        .defaultCount(2_000)
        .maxCount(10_000)
        .basePrice(1)

        .sellableItem(i.Granite)
        .defaultCount(3_000)
        .maxCount(10_000)
        .basePrice(1)

        .sellableItem(i.Tuff)
        .defaultCount(2_000)
        .maxCount(10_000)
        .basePrice(1)

        .sellableItem(i.Deepslate)
        .defaultCount(100)
        .maxCount(20_000)
        .basePrice(2)

        .sellableItem(i.Calcite)
        .defaultCount(10)
        .maxCount(1000)
        .basePrice(10)
    })
  }
}
