import { ItemStack } from '@minecraft/server'
import {
  MinecraftPotionEffectTypes as e,
  MinecraftItemTypes as i,
  MinecraftPotionLiquidTypes as lt,
  MinecraftPotionModifierTypes as mt,
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

      form.itemStack(
        ItemStack.createPotion({ effect: e.FireResistance, liquid: lt.Lingering }).setInfo(i18n`Квас`, undefined),
        new MoneyCost(40),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.FireResistance, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          i18n`Пиво`,
          undefined,
        ),
        new MoneyCost(50),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.Invisibility, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          i18n`Сидр`,
          undefined,
        ),
        new MoneyCost(500),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.WaterBreath, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          i18n`Настойка из шпината`,
          undefined,
        ),
        new MoneyCost(300),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.TurtleMaster, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          i18n`Вино`,
          undefined,
        ),
        new MoneyCost(1000),
      )
    })
  }
}
