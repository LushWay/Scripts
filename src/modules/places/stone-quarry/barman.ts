import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Barman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('barman').name('Бармен'))
    this.shop.body(() => 'Ну что, устал от жизни? Пришел попить?.\n\n')

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.MilkBucket), new MoneyCost(10))
      form.itemStack(new ItemStack(i.HoneyBottle), new MoneyCost(20))

      const pivo = new ItemStack(i.GlassBottle)
      pivo.nameTag = 'Пиво'
      form.itemStack(pivo, new MoneyCost(1))

      const kvac = new ItemStack(i.GlassBottle)
      kvac.nameTag = 'Квас'
      form.itemStack(kvac, new MoneyCost(1))

      const sidr = new ItemStack(i.GlassBottle)
      sidr.nameTag = 'Сидр'
      form.itemStack(sidr, new MoneyCost(1))

      const sh = new ItemStack(i.GlassBottle)
      sh.nameTag = 'Настойка из шпината'
      form.itemStack(sh, new MoneyCost(1))

      const wine = new ItemStack(i.GlassBottle)
      wine.nameTag = 'Вино'
      form.itemStack(wine, new MoneyCost(1))
      // TODO On potion API expansion add WINE
    })
  }
}
