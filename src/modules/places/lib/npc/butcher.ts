import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Butcher extends ShopNpc {
  constructor(group: Group) {
    super(group.point('butcher').name('Мясник'))
    this.shop.body(() => 'И рыбник.\n\n')

    this.shop.menu(form =>
      form
        .sellableItem(i.Beef)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Chicken)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Cod)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Mutton)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Porkchop)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Rabbit)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10)

        .sellableItem(i.Salmon)
        .defaultCount(100)
        .maxCount(1_000)
        .basePrice(10),
    )
  }
}
