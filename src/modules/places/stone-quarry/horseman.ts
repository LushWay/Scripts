import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Horseman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('horseman').name(i18nShared`Кучер`))
    this.shop.body(
      () => i18n`Wtf ой то есть мне пока нечего тебе предложить

`,
    )

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.HorseSpawnEgg), new MoneyCost(200_000))
    })
  }
}
