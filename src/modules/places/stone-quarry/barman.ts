import { ItemStack } from '@minecraft/server'
import {
  MinecraftPotionEffectTypes as e,
  MinecraftItemTypes as i,
  MinecraftPotionLiquidTypes as lt,
  MinecraftPotionModifierTypes as mt,
} from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'

export class Barman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('barman').name(t`Бармен`))
    this.shop.body(() => t`Ну что, устал от жизни? Пришел попить?\n\n`)

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.MilkBucket), new MoneyCost(10))
      form.itemStack(new ItemStack(i.HoneyBottle), new MoneyCost(20))

      form.itemStack(
        ItemStack.createPotion({ effect: e.FireResistance, liquid: lt.Lingering }).setInfo(t`Квас`, undefined),
        new MoneyCost(40),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.FireResistance, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          t`Пиво`,
          undefined,
        ),
        new MoneyCost(50),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.Invisibility, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          t`Сидр`,
          undefined,
        ),
        new MoneyCost(500),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.WaterBreath, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          t`Настойка из шпината`,
          undefined,
        ),
        new MoneyCost(300),
      )

      form.itemStack(
        ItemStack.createPotion({ effect: e.TurtleMaster, liquid: lt.Lingering, modifier: mt.Long }).setInfo(
          t`Вино`,
          undefined,
        ),
        new MoneyCost(1000),
      )
    })
  }
}
