import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Stoner extends ShopNpc {
  constructor(group: Group) {
    super(group.point('stoner').name('Каменщик'))
    this.shop.body(() => 'А камень я тебе дам')

    this.shop.menu(form => {
      form
        .addConfigurableItemSection(i.Andesite)
        .defaultCount(1_000)
        .maxCount(10_000)
        .basePrice(1)

        .addConfigurableItemSection(i.Cobblestone)
        .defaultCount(1_000)
        .maxCount(20_000)
        .basePrice(2)
    })
  }
}
