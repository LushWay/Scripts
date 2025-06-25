import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class AuntZina extends ShopNpc {
  constructor(group: Group) {
    super(group.place('aunt-zina').name(i18nShared`Тетя Зина`))
    this.shop.body(() => i18n`Заходиии, располагайся. Вся еда свежая, только из печи! Яблоко тоже.\n\n`)

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.PumpkinPie, 64), new MoneyCost(400))
      form.itemStack(new ItemStack(i.Bread, 64), new MoneyCost(450))
      form.itemStack(new ItemStack(i.RabbitStew), new MoneyCost(5))
      form.itemStack(new ItemStack(i.BeetrootSoup), new MoneyCost(3))
      form.itemStack(new ItemStack(i.MushroomStew), new MoneyCost(3))
      form.itemStack(new ItemStack(i.BakedPotato, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.Cookie), new MoneyCost(1))
      form.itemStack(new ItemStack(i.Apple, 64), new MoneyCost(500))
    })
  }
}
