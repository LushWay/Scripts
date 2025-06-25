import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Butcher extends ShopNpc {
  constructor(group: Group) {
    super(group.place('butcher').name(i18nShared`Мясник`))
    this.shop.body(() => i18n`И рыбник.\n\n`)

    this.shop.menu(form =>
      form
        .dynamicCostItem(i.Beef)
        .dynamicCostItem(i.Chicken)
        .dynamicCostItem(i.Cod)
        .dynamicCostItem(i.Mutton)
        .dynamicCostItem(i.Porkchop)
        .dynamicCostItem(i.Rabbit)
        .dynamicCostItem(i.Salmon),
    )
  }
}
