import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Barman extends ShopNpc {
  constructor(group: Group) {
    super(group.point('barman').name('Бармен'))
    this.shop.body(() => 'Ну что, устал от жизни? Пришел попить?.\n\n')

    this.shop.menu(form => {
      form.addItemStack(new ItemStack(i.MilkBucket), new MoneyCost(10))
      form.addItemStack(new ItemStack(i.HoneyBottle), new MoneyCost(20))
      // TODO On potion API expansion add WINE
    })
  }
}
