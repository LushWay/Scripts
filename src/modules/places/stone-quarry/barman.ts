import { ItemStack, Potions } from '@minecraft/server'
import {
  MinecraftPotionEffectTypes as e,
  MinecraftItemTypes as i,
  MinecraftPotionDeliveryTypes as lt,
} from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Barman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('barman').name(i18nShared`Бармен`))
    this.shop.body(() => i18n`Ну что, устал от жизни? Пришел попить?\n\n`)

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.MilkBucket), new MoneyCost(10))
      form.itemStack(new ItemStack(i.HoneyBottle), new MoneyCost(20))

      form.itemStack(Potions.resolve(e.FireResistance, lt.Consume).setInfo(i18n`Квас`, undefined), new MoneyCost(40))

      form.itemStack(
        Potions.resolve(e.LongFireResistance, lt.Consume).setInfo(i18n`Пиво`, undefined),
        new MoneyCost(50),
      )

      form.itemStack(Potions.resolve(e.LongInvisibility, lt.Consume).setInfo(i18n`Сидр`, undefined), new MoneyCost(500))

      form.itemStack(
        Potions.resolve(e.LongWaterBreathing, lt.Consume).setInfo(i18n`Настойка из шпината`, undefined),
        new MoneyCost(300),
      )

      form.potion
      form.itemStack(
        Potions.resolve(e.LongTurtleMaster, lt.Consume).setInfo(i18n`Вино`, undefined),
        new MoneyCost(1000),
      )
    })
  }
}
