import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Butcher extends ShopNpc {
  constructor(group: Group) {
    super(group.point('butcher').name('Мясник'))
    this.shop.body(() => 'И рыбник.')

    this.shop.menu(form =>
      form
        .addConfigurableItemSection(i.Beef)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Chicken)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Cod)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Mutton)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Porkchop)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Rabbit)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .addConfigurableItemSection(i.Salmon)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10),
    )
  }
}
